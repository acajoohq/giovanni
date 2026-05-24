use std::sync::Mutex;

use crate::state::{AppState, PendingOpenResult};

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Consume the pending action set by the OS context menu launch and read the
/// associated file's bytes. Returns `None` when the app was opened normally.
/// The file path is never accepted as a parameter — only the path already
/// stored in state is read, preventing arbitrary file access from the webview.
#[tauri::command]
pub fn get_pending_action(
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<Option<PendingOpenResult>, String> {
    let Some(pending) = state.lock().unwrap().pending_action.take() else {
        return Ok(None);
    };
    let file_bytes = std::fs::read(&pending.file_path).map_err(|e| e.to_string())?;
    Ok(Some(PendingOpenResult {
        action: pending.action,
        file_path: pending.file_path,
        file_bytes,
    }))
}

/// Register Giovanni's cascading context menu for .pdf files in the OS.
/// - Windows: `HKCU\Software\Classes\SystemFileAssociations\.pdf\shell`
/// - macOS:   Automator Service workflows in `~/Library/Services/`
/// - Linux:   Nautilus scripts + KDE service menu
///
/// The executable path is always derived from `current_exe()` — no path is
/// accepted from the frontend to prevent arbitrary binary registration.
#[tauri::command]
pub fn register_context_menu() -> Result<(), String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let app_exe = exe_path.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    return crate::platform::windows::register(&app_exe);

    #[cfg(target_os = "macos")]
    return crate::platform::macos::register(&app_exe);

    #[cfg(target_os = "linux")]
    return crate::platform::linux::register(&app_exe);

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = app_exe;
        Err("OS context menu registration is not supported on this platform.".to_string())
    }
}

/// Remove all Giovanni context menu entries from the OS.
#[tauri::command]
pub fn unregister_context_menu() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    return crate::platform::windows::unregister();

    #[cfg(target_os = "macos")]
    return crate::platform::macos::unregister();

    #[cfg(target_os = "linux")]
    return crate::platform::linux::unregister();

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    Err("OS context menu unregistration is not supported on this platform.".to_string())
}
