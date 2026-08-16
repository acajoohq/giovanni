use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};

use super::ffi::{
    giovanni_buffer_free, giovanni_document_info_free, giovanni_get_document_info,
    giovanni_get_version, giovanni_last_error, giovanni_merge_pdfs, giovanni_pages_free,
    giovanni_qpdf_create, giovanni_qpdf_destroy, giovanni_split_pages, giovanni_write_pdf,
    giovanni_ghostscript_create, giovanni_ghostscript_destroy, giovanni_rewrite_pdf,
    GiovanniDocumentInfo, GiovanniQpdfHandle, GiovanniWriteOptions,
    GiovanniGhostscriptHandle,
};

pub struct GiovanniEngine {
    qpdf_handle: *mut GiovanniQpdfHandle,
    gs_handle: *mut GiovanniGhostscriptHandle,
}

// Safety: the C library creates a per-handle context with thread-local error storage.
// Each GiovanniEngine owns its handle exclusively and is never shared across threads.
unsafe impl Send for GiovanniEngine {}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentInfo {
    pub num_pages: i32,
    pub pdf_version: String,
    pub is_encrypted: bool,
    pub is_linearized: bool,
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub creator: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteOptions {
    pub compression_level: i32,
    pub recompress_flate: bool,
    pub decode_level: String,
    pub object_streams: String,
    pub compress_pages: bool,
    pub remove_unreferenced_resources: bool,
    pub linearize: bool,
}

impl Default for WriteOptions {
    fn default() -> Self {
        Self {
            compression_level: 6,
            recompress_flate: true,
            decode_level: "generalized".into(),
            object_streams: "generate".into(),
            compress_pages: false,
            remove_unreferenced_resources: false,
            linearize: false,
        }
    }
}

impl GiovanniEngine {
    pub fn new() -> Result<Self, String> {
        let qpdf_handle = unsafe { giovanni_qpdf_create() };
        if qpdf_handle.is_null() {
            return Err("Failed to create giovanni engine".into());
        }
        let gs_handle = unsafe { giovanni_ghostscript_create() };
        if gs_handle.is_null() {
            return Err("Failed to create giovanni ghostscript engine".into());
        }
        Ok(Self { qpdf_handle, gs_handle })
    }

    pub fn get_version(&self) -> Result<String, String> {
        let mut buf = [0i8; 64];
        let res = unsafe { giovanni_get_version(self.qpdf_handle, buf.as_mut_ptr(), buf.len()) };
        if res != 0 {
            return Err(self.last_error());
        }
        Ok(unsafe { CStr::from_ptr(buf.as_ptr()) }
            .to_string_lossy()
            .into_owned())
    }

    pub fn get_info(&self, data: &[u8], password: Option<&str>) -> Result<DocumentInfo, String> {
        let password_cstr = password
            .map(|p| CString::new(p).map_err(|_| "Invalid password".to_string()))
            .transpose()?;
        let password_ptr = password_cstr
            .as_ref()
            .map_or(std::ptr::null(), |s| s.as_ptr());

        let mut raw: GiovanniDocumentInfo = unsafe { std::mem::zeroed() };
        let res = unsafe {
            giovanni_get_document_info(
                self.qpdf_handle,
                data.as_ptr(),
                data.len(),
                password_ptr,
                &mut raw,
            )
        };

        if res != 0 {
            return Err(self.last_error());
        }

        let info = unsafe { document_info_from_raw(&raw) };
        unsafe { giovanni_document_info_free(&mut raw) };
        Ok(info)
    }

    pub fn write_pdf(
        &self,
        data: &[u8],
        options: Option<&WriteOptions>,
        password: Option<&str>,
    ) -> Result<Vec<u8>, String> {
        let (decode_level_cstr, object_streams_cstr, c_opts) = match options {
            Some(opts) => {
                let dl = CString::new(opts.decode_level.as_str())
                    .map_err(|_| "Invalid decode_level".to_string())?;
                let os = CString::new(opts.object_streams.as_str())
                    .map_err(|_| "Invalid object_streams".to_string())?;
                let c = GiovanniWriteOptions {
                    compression_level: opts.compression_level,
                    recompress_flate: opts.recompress_flate as i32,
                    decode_level: dl.as_ptr(),
                    object_streams: os.as_ptr(),
                    compress_pages: opts.compress_pages as i32,
                    remove_unreferenced_resources: opts.remove_unreferenced_resources as i32,
                    linearize: opts.linearize as i32,
                };
                (Some(dl), Some(os), Some(c))
            }
            None => (None, None, None),
        };

        let opts_ptr = c_opts.as_ref().map_or(std::ptr::null(), |o| o as *const _);
        let password_cstr = password
            .map(|p| CString::new(p).map_err(|_| "Invalid password".to_string()))
            .transpose()?;
        let password_ptr = password_cstr
            .as_ref()
            .map_or(std::ptr::null(), |s| s.as_ptr());

        let mut out_data: *mut u8 = std::ptr::null_mut();
        let mut out_size: usize = 0;

        let res = unsafe {
            giovanni_write_pdf(
                self.qpdf_handle,
                data.as_ptr(),
                data.len(),
                opts_ptr,
                password_ptr,
                &mut out_data,
                &mut out_size,
            )
        };

        // Keep CStrings alive until after the C call returns
        drop((decode_level_cstr, object_streams_cstr, c_opts));

        if res != 0 {
            return Err(self.last_error());
        }

        let result = unsafe { std::slice::from_raw_parts(out_data, out_size).to_vec() };
        unsafe { giovanni_buffer_free(out_data) };
        Ok(result)
    }

    pub fn rewrite_pdf(&self, data: &[u8], args: &[&str]) -> Result<Vec<u8>, String> {
        let c_args: Vec<CString> = args
            .iter()
            .map(|a| CString::new(*a).map_err(|_| "Invalid ghostscript argument".to_string()))
            .collect::<Result<_, _>>()?;
        let c_arg_ptrs: Vec<*const std::ffi::c_char> =
            c_args.iter().map(|s| s.as_ptr()).collect();

        let mut out_data: *mut u8 = std::ptr::null_mut();
        let mut out_size: usize = 0;

        let res = unsafe {
            giovanni_rewrite_pdf(
                self.gs_handle,
                data.as_ptr(),
                data.len(),
                c_arg_ptrs.as_ptr(),
                c_arg_ptrs.len(),
                &mut out_data,
                &mut out_size,
            )
        };

        // Keep the CStrings (and the pointer vec derived from them) alive until
        // after the C call returns.
        drop(c_args);

        if res != 0 {
            return Err(self.last_error());
        }

        let result = unsafe { std::slice::from_raw_parts(out_data, out_size).to_vec() };
        unsafe { giovanni_buffer_free(out_data) };
        Ok(result)
    }

    pub fn split_pages(&self, data: &[u8]) -> Result<Vec<Vec<u8>>, String> {
        let mut out_pages: *mut *mut u8 = std::ptr::null_mut();
        let mut out_sizes: *mut usize = std::ptr::null_mut();
        let mut out_count: usize = 0;

        let res = unsafe {
            giovanni_split_pages(
                self.qpdf_handle,
                data.as_ptr(),
                data.len(),
                &mut out_pages,
                &mut out_sizes,
                &mut out_count,
            )
        };

        if res != 0 {
            return Err(self.last_error());
        }

        let pages = unsafe {
            (0..out_count)
                .map(|i| {
                    let ptr = *out_pages.add(i);
                    let len = *out_sizes.add(i);
                    std::slice::from_raw_parts(ptr, len).to_vec()
                })
                .collect()
        };

        unsafe { giovanni_pages_free(out_pages, out_sizes, out_count) };
        Ok(pages)
    }

    pub fn merge_pdfs(&self, inputs: &[&[u8]]) -> Result<Vec<u8>, String> {
        let ptrs: Vec<*const u8> = inputs.iter().map(|s| s.as_ptr()).collect();
        let sizes: Vec<usize> = inputs.iter().map(|s| s.len()).collect();

        let mut out_data: *mut u8 = std::ptr::null_mut();
        let mut out_size: usize = 0;

        let res = unsafe {
            giovanni_merge_pdfs(
                self.qpdf_handle,
                ptrs.as_ptr(),
                sizes.as_ptr(),
                inputs.len(),
                &mut out_data,
                &mut out_size,
            )
        };

        if res != 0 {
            return Err(self.last_error());
        }

        let result = unsafe { std::slice::from_raw_parts(out_data, out_size).to_vec() };
        unsafe { giovanni_buffer_free(out_data) };
        Ok(result)
    }

    fn last_error(&self) -> String {
        unsafe { CStr::from_ptr(giovanni_last_error()) }
            .to_string_lossy()
            .into_owned()
    }
}

unsafe fn document_info_from_raw(raw: &GiovanniDocumentInfo) -> DocumentInfo {
    let pdf_version = CStr::from_ptr(raw.pdf_version.as_ptr())
        .to_string_lossy()
        .into_owned();

    let opt_str = |ptr: *mut std::ffi::c_char| {
        if ptr.is_null() {
            None
        } else {
            Some(CStr::from_ptr(ptr).to_string_lossy().into_owned())
        }
    };

    DocumentInfo {
        num_pages: raw.num_pages,
        pdf_version,
        is_encrypted: raw.is_encrypted != 0,
        is_linearized: raw.is_linearized != 0,
        title: opt_str(raw.title),
        author: opt_str(raw.author),
        subject: opt_str(raw.subject),
        creator: opt_str(raw.creator),
    }
}

impl Drop for GiovanniEngine {
    fn drop(&mut self) {
        unsafe { giovanni_qpdf_destroy(self.qpdf_handle) };
        unsafe { giovanni_ghostscript_destroy(self.gs_handle) };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_lifecycle() {
        let engine = GiovanniEngine::new();
        assert!(engine.is_ok());
    }

    #[test]
    fn test_get_info_invalid_data() {
        let engine = GiovanniEngine::new().unwrap();
        let result = engine.get_info(b"not a pdf", None);
        assert!(result.is_err());
    }

    #[test]
    fn test_rewrite_pdf_with_ghostscript() {
        const MINI_PDF: &[u8] = b"%PDF-1.4\n\
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n\
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n\
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n\
xref\n\
0 4\n\
0000000000 65535 f \n\
trailer<</Size 4/Root 1 0 R>>\n\
startxref\n\
0\n\
%%EOF\n";

        let engine = GiovanniEngine::new().unwrap();
        let args = ["-sDEVICE=pdfwrite", "-dNOPAUSE", "-dBATCH", "-dSAFER"];
        let output = engine.rewrite_pdf(MINI_PDF, &args).unwrap();

        assert!(!output.is_empty());
        assert_eq!(&output[..4], b"%PDF");
    }
}
