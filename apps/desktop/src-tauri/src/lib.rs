mod cli;
mod commands;
#[cfg(feature = "devtools")]
mod menu;
mod platform;
mod state;

use std::sync::Mutex;
use state::AppState;

// ── Entry point ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pending_action = cli::parse_pending_action();

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(AppState { pending_action }))
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_pending_action,
            commands::register_context_menu,
            commands::unregister_context_menu,
        ])
        .setup(|_app| {
            // Auto-register the OS context menu every startup so the path stays
            // current even after the binary is moved or updated.
            #[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
            if let Ok(exe_path) = std::env::current_exe() {
                let exe_str = exe_path.to_string_lossy().to_string();

                #[cfg(target_os = "windows")]
                if let Err(e) = platform::windows::register(&exe_str) {
                    eprintln!("Warning: could not register OS context menu: {e}");
                }

                #[cfg(target_os = "macos")]
                if let Err(e) = platform::macos::register(&exe_str) {
                    eprintln!("Warning: could not register OS context menu: {e}");
                }

                #[cfg(target_os = "linux")]
                if let Err(e) = platform::linux::register(&exe_str) {
                    eprintln!("Warning: could not register OS context menu: {e}");
                }
            }

            Ok(())
        });

    #[cfg(feature = "devtools")]
    let builder = builder
        .menu(|handle| menu::build_app_menu(handle))
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event.id().as_ref());
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
