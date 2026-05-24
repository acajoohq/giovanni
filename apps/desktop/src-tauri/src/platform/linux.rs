use std::fs;
use std::os::unix::fs::PermissionsExt;

/// Convert an action slug (e.g. "extract-images") to a CamelCase identifier
/// suitable for KDE `.desktop` Action keys (e.g. "ExtractImages").
fn kde_action_id(action: &str) -> String {
    action
        .split('-')
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            }
        })
        .collect()
}

/// Install Giovanni context menu integrations for Linux:
///
/// - **Nautilus / GNOME**: executable scripts in `~/.local/share/nautilus/scripts/Giovanni/`
///   (appear under right-click → Scripts for any selected file)
/// - **Dolphin / KDE**: a service-menu `.desktop` file in
///   `~/.local/share/kio/servicemenus/` filtered to `application/pdf`
pub fn register(app_exe: &str) -> Result<(), String> {
    let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
    let home_path = std::path::PathBuf::from(&home);

    // ── Nautilus scripts ──────────────────────────────────────────────────────
    let scripts_dir = home_path.join(".local/share/nautilus/scripts/Giovanni");
    fs::create_dir_all(&scripts_dir).map_err(|e| e.to_string())?;

    for (action, label) in super::ACTIONS {
        let script_path = scripts_dir.join(label);
        // NAUTILUS_SCRIPT_SELECTED_FILE_PATHS is newline-separated list of paths
        let script = format!(
            "#!/bin/bash\n\
             # Giovanni — {label}\n\
             while IFS= read -r f; do\n\
             \t[ -n \"$f\" ] && \"{app_exe}\" --action {action} --file \"$f\" &\n\
             done <<< \"$NAUTILUS_SCRIPT_SELECTED_FILE_PATHS\"\n"
        );
        fs::write(&script_path, script).map_err(|e| e.to_string())?;
        let mut perms = fs::metadata(&script_path)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script_path, perms).map_err(|e| e.to_string())?;
    }

    // ── KDE service menu ──────────────────────────────────────────────────────
    let servicemenus_dir = home_path.join(".local/share/kio/servicemenus");
    fs::create_dir_all(&servicemenus_dir).map_err(|e| e.to_string())?;

    let action_ids: Vec<String> = super::ACTIONS.iter().map(|(a, _)| kde_action_id(a)).collect();

    let mut desktop = format!(
        "[Desktop Entry]\n\
         Type=Service\n\
         X-KDE-ServiceTypes=KonqPopupMenu/Plugin\n\
         MimeType=application/pdf;\n\
         Icon=document-viewer\n\
         X-KDE-Priority=TopLevel\n\
         X-KDE-Submenu=Open with Giovanni\n\
         Actions={}\n\n",
        action_ids.join(";")
    );

    for (action, label) in super::ACTIONS {
        desktop.push_str(&format!(
            "[Desktop Action {}]\n\
             Name={}\n\
             Icon=application-pdf\n\
             Exec=\"{}\" --action {} --file %f\n\n",
            kde_action_id(action),
            label,
            app_exe,
            action,
        ));
    }

    fs::write(servicemenus_dir.join("giovanni.desktop"), desktop)
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn unregister() -> Result<(), String> {
    let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
    let home_path = std::path::PathBuf::from(home);

    let nautilus_dir = home_path.join(".local/share/nautilus/scripts/Giovanni");
    if nautilus_dir.exists() {
        fs::remove_dir_all(&nautilus_dir).map_err(|e| e.to_string())?;
    }

    let kde_file = home_path.join(".local/share/kio/servicemenus/giovanni.desktop");
    if kde_file.exists() {
        fs::remove_file(&kde_file).map_err(|e| e.to_string())?;
    }

    Ok(())
}
