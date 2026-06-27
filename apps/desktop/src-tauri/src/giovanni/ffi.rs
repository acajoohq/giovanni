use std::ffi::{c_char, c_int, c_void};

// Le handle opaque
#[repr(C)]
pub struct GiovanniQpdfHandle(c_void);

#[repr(C)]
pub struct GiovanniWriteOptions {
    pub compression_level: c_int,
    pub recompress_flate: c_int,
    pub decode_level: *const c_char,
    pub object_streams: *const c_char,
    pub compress_pages: c_int,
    pub remove_unreferenced_resources: c_int,
    pub linearize: c_int,
}

#[repr(C)]
pub struct GiovanniDocumentInfo {
    pub num_pages: c_int,
    pub pdf_version: [c_char; 32],
    pub is_encrypted: c_int,
    pub is_linearized: c_int,
    pub title: *mut c_char,
    pub author: *mut c_char,
    pub subject: *mut c_char,
    pub creator: *mut c_char,
}

extern "C" {
    pub fn giovanni_qpdf_create() -> *mut GiovanniQpdfHandle;
    pub fn giovanni_qpdf_destroy(handle: *mut GiovanniQpdfHandle);
    pub fn giovanni_write_options_default(opts: *mut GiovanniWriteOptions);
    pub fn giovanni_get_document_info(
        handle: *mut GiovanniQpdfHandle,
        input: *const u8,
        input_size: usize,
        password: *const c_char,
        out: *mut GiovanniDocumentInfo,
    ) -> c_int;
    pub fn giovanni_document_info_free(info: *mut GiovanniDocumentInfo);
    pub fn giovanni_last_error() -> *const c_char;
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CStr;

    #[test]
    fn test_ffi_linkage_version() {
        unsafe {
            let handle = giovanni_qpdf_create();
            assert!(!handle.is_null(), "Le handle C++ est nul !");

            let mut buffer = [0u8; 32];
            let res = giovanni_get_version(handle, buffer.as_mut_ptr() as *mut i8, buffer.len());

            assert_eq!(res, 0);
            let version = CStr::from_ptr(buffer.as_ptr() as *const i8).to_string_lossy();
            println!("Version détectée : {}", version);

            giovanni_qpdf_destroy(handle);
        }
    }
}
