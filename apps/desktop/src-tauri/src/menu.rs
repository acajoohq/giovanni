use tauri::menu::{Menu, MenuItemBuilder, MenuItemKind, SubmenuBuilder};
use tauri::{AppHandle, Manager, Wry};

const MENU_TOGGLE_DEVTOOLS: &str = "toggle_devtools";
const VIEW_SUBMENU_TEXT: &str = "View";

pub fn build_app_menu(handle: &AppHandle<Wry>) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::default(handle)?;

    #[cfg(any(dev, debug_assertions))]
    append_devtools_item(handle, &menu)?;

    Ok(menu)
}

#[cfg(any(dev, debug_assertions))]
fn append_devtools_item(handle: &AppHandle<Wry>, menu: &Menu<Wry>) -> tauri::Result<()> {
    let devtools_item = MenuItemBuilder::with_id(MENU_TOGGLE_DEVTOOLS, "Toggle Developer Tools")
        .accelerator("CmdOrCtrl+Alt+I")
        .build(handle)?;

    if let Some(view_submenu) = find_view_submenu(menu)? {
        view_submenu.append(&devtools_item)?;
        return Ok(());
    }

    let view_submenu = SubmenuBuilder::new(handle, VIEW_SUBMENU_TEXT)
        .item(&devtools_item)
        .build()?;

    menu.append(&view_submenu)?;
    Ok(())
}

fn find_view_submenu(menu: &Menu<Wry>) -> tauri::Result<Option<tauri::menu::Submenu<Wry>>> {
    for item in menu.items()? {
        if let MenuItemKind::Submenu(submenu) = item {
            if submenu.text()? == VIEW_SUBMENU_TEXT {
                return Ok(Some(submenu));
            }
        }
    }

    Ok(None)
}

pub fn handle_menu_event(app: &AppHandle, event_id: &str) {
    if event_id != MENU_TOGGLE_DEVTOOLS {
        return;
    }

    if let Some(window) = app.get_webview_window("main") {
        if window.is_devtools_open() {
            let _ = window.close_devtools();
        } else {
            let _ = window.open_devtools();
        }
    }
}
