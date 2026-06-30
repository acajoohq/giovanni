use winreg::enums::*;
use winreg::RegKey;

const BASE: &str = r"Software\Classes\SystemFileAssociations\.pdf\shell";

fn register_group(
    hkcu: &RegKey,
    key_name: &str,
    label: &str,
    app_exe: &str,
    actions: &[(&str, &str)],
    open_ui: bool,
) -> Result<(), String> {
    let group_path = format!(r"{BASE}\{key_name}");
    let (group_key, _) = hkcu.create_subkey(&group_path).map_err(|e| e.to_string())?;

    group_key.set_value("MUIVerb", &label).map_err(|e| e.to_string())?;
    group_key.set_value("SubCommands", &"").map_err(|e| e.to_string())?;
    group_key
        .set_value("Icon", &format!("{},0", app_exe).as_str())
        .map_err(|e| e.to_string())?;

    for (action, action_label) in actions {
        let item_path = format!(r"{group_path}\shell\{action}");
        let (item_key, _) = hkcu.create_subkey(&item_path).map_err(|e| e.to_string())?;
        item_key.set_value("MUIVerb", action_label).map_err(|e| e.to_string())?;

        let (cmd_key, _) = hkcu
            .create_subkey(format!(r"{item_path}\command"))
            .map_err(|e| e.to_string())?;
        // %1 is replaced by Windows with the selected file path.
        // --open-ui bypasses the headless fast-path so the UI always opens.
        let command = if open_ui {
            format!("\"{}\" --action {} --file \"%1\" --open-ui", app_exe, action)
        } else {
            format!("\"{}\" --action {} --file \"%1\"", app_exe, action)
        };
        cmd_key.set_value("", &command.as_str()).map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn register(app_exe: &str) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // Group 1 — instant headless actions (no window opens)
    register_group(&hkcu, "Giovanni", "Giovanni", app_exe, super::HEADLESS_ACTIONS, false)?;

    // Group 2 — always opens the UI (--open-ui bypasses the headless fast-path)
    register_group(&hkcu, "GiovanniOpen", "Open with Giovanni", app_exe, super::UI_ACTIONS, true)?;

    Ok(())
}

pub fn unregister() -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    for key_name in ["Giovanni", "GiovanniOpen"] {
        let _ = hkcu.delete_subkey_all(format!(r"{BASE}\{key_name}"));
    }
    Ok(())
}
