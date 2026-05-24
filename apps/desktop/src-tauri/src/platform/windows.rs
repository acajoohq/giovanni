use winreg::enums::*;
use winreg::RegKey;

pub fn register(app_exe: &str) -> Result<(), String> {
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

    for (action, label) in super::ACTIONS {
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

pub fn unregister() -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    hkcu.delete_subkey_all(r"Software\Classes\SystemFileAssociations\.pdf\shell\Giovanni")
        .map_err(|e| e.to_string())
}
