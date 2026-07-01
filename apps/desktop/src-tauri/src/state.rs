use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct PendingOpenAction {
    pub action: String,
    pub file_path: String,
    /// When true the user chose "Open with Giovanni" — always open the UI even
    /// for actions that have a headless fast-path (compress, split).
    pub open_ui: bool,
}

#[derive(Debug, Serialize)]
pub struct PendingOpenResult {
    pub action: String,
    pub file_path: String,
    pub file_bytes: Vec<u8>,
}

pub(crate) struct AppState {
    pub(crate) pending_action: Option<PendingOpenAction>,
}
