use serde::Serialize;
use std::sync::Mutex;

// ── Shared state ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct PendingOpenAction {
    pub action: String,
    pub file_path: String,
}

struct AppState {
    pending_action: Option<PendingOpenAction>,
}

// ── Tauri commands ────────────────────────────────────────────────────────────

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Consume the pending action set by the OS context menu launch.
/// Returns `None` when the app was opened normally (not via right-click).
#[tauri::command]
fn get_pending_action(state: tauri::State<'_, Mutex<AppState>>) -> Option<PendingOpenAction> {
    state.lock().unwrap().pending_action.take()
}

/// Read a local file's raw bytes so the frontend WASM tools can process it.
#[tauri::command]
fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

/// Register Giovanni's cascading context menu for .pdf files in the OS.
/// On Windows this writes to `HKCU\Software\Classes\SystemFileAssociations\.pdf\shell`.
/// On other platforms it returns an informative error.
#[tauri::command]
fn register_context_menu(app_exe: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    return register_context_menu_windows(&app_exe);

    #[cfg(not(target_os = "windows"))]
    {
        let _ = app_exe;
        Err("OS context menu registration is not yet supported on this platform.".to_string())
    }
}

/// Remove all Giovanni context menu entries from the OS.
#[tauri::command]
fn unregister_context_menu() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    return unregister_context_menu_windows();

    #[cfg(not(target_os = "windows"))]
    Err("OS context menu unregistration is not yet supported on this platform.".to_string())
}

// ── Windows registry helpers ──────────────────────────────────────────────────

#[cfg(target_os = "windows")]
fn register_context_menu_windows(app_exe: &str) -> Result<(), String> {
    use winreg::enums::*;
    use winreg::RegKey;

    // Actions exposed in the cascading submenu
    let actions: &[(&str, &str)] = &[
        ("compress", "Compress"),
        ("split", "Split pages"),
        ("merge", "Merge"),
        ("organize", "Organize pages"),
        ("extract-images", "Extract images"),
        ("pdf-to-jpg", "Convert to JPG"),
    ];

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // `SystemFileAssociations` is the correct key for type-based context menus
    // that work regardless of which app is set as the PDF default.
    let parent_path = r"Software\Classes\SystemFileAssociations\.pdf\shell\Giovanni";

    let (parent_key, _) = hkcu
        .create_subkey(parent_path)
        .map_err(|e| e.to_string())?;

    parent_key
        .set_value("MUIVerb", &"Open with Giovanni")
        .map_err(|e| e.to_string())?;
    // Empty SubCommands tells Windows to look for a `shell` sub-key for items
    parent_key
        .set_value("SubCommands", &"")
        .map_err(|e| e.to_string())?;
    parent_key
        .set_value("Icon", &format!("{},0", app_exe).as_str())
        .map_err(|e| e.to_string())?;

    let shell_path = format!(r"{}\shell", parent_path);

    for (action, label) in actions {
        let item_path = format!(r"{}\{}", shell_path, action);
        let (item_key, _) = hkcu
            .create_subkey(&item_path)
            .map_err(|e| e.to_string())?;
        item_key
            .set_value("MUIVerb", label)
            .map_err(|e| e.to_string())?;

        let cmd_path = format!(r"{}\command", item_path);
        let (cmd_key, _) = hkcu
            .create_subkey(&cmd_path)
            .map_err(|e| e.to_string())?;
        // %1 is replaced by Windows with the selected file path
        let command = format!("\"{}\" --action {} --file \"%1\"", app_exe, action);
        cmd_key
            .set_value("", &command)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn unregister_context_menu_windows() -> Result<(), String> {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    hkcu.delete_subkey_all(r"Software\Classes\SystemFileAssociations\.pdf\shell\Giovanni")
        .map_err(|e| e.to_string())
}

// ── CLI argument parsing ──────────────────────────────────────────────────────

/// Parse `--action <name> --file <path>` from the process arguments.
/// These are set by the OS context menu command registered in the registry.
fn parse_pending_action() -> Option<PendingOpenAction> {
    let args: Vec<String> = std::env::args().collect();
    let mut action: Option<String> = None;
    let mut file_path: Option<String> = None;

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--action" if i + 1 < args.len() => {
                action = Some(args[i + 1].clone());
                i += 2;
            }
            "--file" if i + 1 < args.len() => {
                file_path = Some(args[i + 1].clone());
                i += 2;
            }
            _ => {
                i += 1;
            }
        }
    }

    match (action, file_path) {
        (Some(action), Some(file_path)) => Some(PendingOpenAction { action, file_path }),
        _ => None,
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pending_action = parse_pending_action();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(AppState { pending_action }))
        .invoke_handler(tauri::generate_handler![
            greet,
            get_pending_action,
            read_file_bytes,
            register_context_menu,
            unregister_context_menu,
        ])
        .setup(|_app| {
            // Auto-register the OS context menu every startup so the path stays
            // current even after the binary is moved or updated.
            #[cfg(target_os = "windows")]
            if let Ok(exe_path) = std::env::current_exe() {
                let exe_str = exe_path.to_string_lossy().to_string();
                if let Err(e) = register_context_menu_windows(&exe_str) {
                    eprintln!("Warning: could not register OS context menu: {e}");
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
