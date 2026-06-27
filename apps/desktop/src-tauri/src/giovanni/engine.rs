use super::ffi::{
    giovanni_get_document_info,
    giovanni_last_error,
    giovanni_qpdf_create,
    giovanni_qpdf_destroy,
    giovanni_document_info_free,
    GiovanniDocumentInfo,
    GiovanniQpdfHandle,
};
use std::ffi::CStr;

pub struct GiovanniEngine {
    handle: *mut GiovanniQpdfHandle,
}

impl GiovanniEngine {
    pub fn new() -> Result<Self, String> {
        let h = unsafe { giovanni_qpdf_create() };
        if h.is_null() {
            return Err("Failed to create engine".into());
        }
        Ok(Self { handle: h })
    }

    pub fn get_info(&self, data: &[u8]) -> Result<GiovanniDocumentInfo, String> {
        let mut info = unsafe { std::mem::zeroed() };
        let res = unsafe {
            giovanni_get_document_info(
                self.handle,
                data.as_ptr(),
                data.len(),
                std::ptr::null(),
                &mut info,
            )
        };

        if res == 0 {
            Ok(info)
        } else {
            let err = unsafe { std::ffi::CStr::from_ptr(giovanni_last_error()) };
            Err(err.to_string_lossy().into_owned())
        }
    }
}

impl Drop for GiovanniEngine {
    fn drop(&mut self) {
        unsafe { giovanni_qpdf_destroy(self.handle) };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_lifecycle() {
        // Test que l'initialisation fonctionne
        let engine = GiovanniEngine::new();
        assert!(engine.is_ok());

        // Le drop (libération mémoire C++) sera appelé automatiquement ici
    }

    #[test]
    fn test_get_info_invalid_data() {
        let engine = GiovanniEngine::new().unwrap();
        // On passe des données bidon, ça devrait retourner une Err (Result)
        // proprement gérée par le C++ au lieu de crash
        let result = engine.get_info(b"pas un pdf");
        assert!(result.is_err());
    }
}
