use tauri::menu::{Menu, MenuItemBuilder, MenuItemKind, SubmenuBuilder, WINDOW_SUBMENU_ID};
use tauri::{AppHandle, Manager, Wry};

pub const MAIN_WINDOW_LABEL: &str = "main";

const MENU_TOGGLE_DEVTOOLS: &str = "toggle_devtools";

pub fn build_app_menu(handle: &AppHandle<Wry>) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::default(handle)?;

    let devtools_item = MenuItemBuilder::with_id(MENU_TOGGLE_DEVTOOLS, "Toggle Developer Tools")
        .accelerator("CmdOrCtrl+Alt+I")
        .build(handle)?;

    if let Some(MenuItemKind::Submenu(window_submenu)) = menu.get(WINDOW_SUBMENU_ID) {
        window_submenu.append(&devtools_item)?;
        return Ok(menu);
    }

    let devtools_submenu = SubmenuBuilder::new(handle, "Developer")
        .item(&devtools_item)
        .build()?;

    menu.append(&devtools_submenu)?;
    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, event_id: &str) {
    if event_id != MENU_TOGGLE_DEVTOOLS {
        return;
    }

    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        eprintln!(
            "Warning: devtools menu action ignored — window '{MAIN_WINDOW_LABEL}' not found"
        );
        return;
    };

    if window.is_devtools_open() {
        window.close_devtools();
    } else {
        window.open_devtools();
    }
}
