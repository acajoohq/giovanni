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
/// - Windows: `HKCU\Software\Classes\SystemFileAssociations\.pdf\shell`
/// - macOS:   Automator Service workflows in `~/Library/Services/`
/// - Linux:   Nautilus scripts + KDE service menu
#[tauri::command]
fn register_context_menu(app_exe: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    return register_context_menu_windows(&app_exe);

    #[cfg(target_os = "macos")]
    return register_context_menu_macos(&app_exe);

    #[cfg(target_os = "linux")]
    return register_context_menu_linux(&app_exe);

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = app_exe;
        Err("OS context menu registration is not supported on this platform.".to_string())
    }
}

/// Remove all Giovanni context menu entries from the OS.
#[tauri::command]
fn unregister_context_menu() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    return unregister_context_menu_windows();

    #[cfg(target_os = "macos")]
    return unregister_context_menu_macos();

    #[cfg(target_os = "linux")]
    return unregister_context_menu_linux();

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    Err("OS context menu unregistration is not supported on this platform.".to_string())
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

// ── macOS Automator Service helpers ──────────────────────────────────────────

/// Escapes a string for embedding in an XML plist text node.
#[cfg(target_os = "macos")]
fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// `Info.plist` content for a single Automator Service workflow.
/// The `NSSendFileTypes` key restricts the service to PDF files only.
#[cfg(target_os = "macos")]
fn workflow_info_plist(action: &str, workflow_name: &str) -> String {
    let esc_name = xml_escape(workflow_name);
    let esc_action = xml_escape(action);
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleIdentifier</key>
	<string>com.semoule.giovanni.service.{esc_action}</string>
	<key>CFBundleName</key>
	<string>{esc_name}</string>
	<key>NSServices</key>
	<array>
		<dict>
			<key>NSMenuItem</key>
			<dict>
				<key>default</key>
				<string>{esc_name}</string>
			</dict>
			<key>NSSendFileTypes</key>
			<array>
				<string>com.adobe.pdf</string>
			</array>
			<key>NSMessage</key>
			<string>runWorkflowAsService</string>
			<key>NSPortName</key>
			<string>{esc_name}</string>
		</dict>
	</array>
</dict>
</plist>
"#
    )
}

/// `document.wflow` plist for a "Run Shell Script" Automator action that
/// launches Giovanni with the selected file path.
#[cfg(target_os = "macos")]
fn workflow_document(app_exe: &str, action: &str, workflow_name: &str) -> String {
    // Shell command: iterate arguments ($@ = one path per selected file)
    let raw_cmd = format!(
        "for f in \"$@\"; do\n    \"{app_exe}\" --action {action} --file \"$f\" &\ndone"
    );
    let esc_cmd = xml_escape(&raw_cmd);
    let esc_name = xml_escape(workflow_name);
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>AMApplicationBuild</key>
	<string>522</string>
	<key>AMApplicationVersion</key>
	<string>2.10</string>
	<key>AMDocumentVersion</key>
	<string>2</string>
	<key>actions</key>
	<array>
		<dict>
			<key>action</key>
			<dict>
				<key>AMAccepts</key>
				<dict>
					<key>Container</key>
					<string>List</string>
					<key>Optional</key>
					<true/>
					<key>Types</key>
					<array>
						<string>com.adobe.pdf</string>
					</array>
				</dict>
				<key>AMActionVersion</key>
				<string>2.0.3</string>
				<key>AMApplication</key>
				<array>
					<string>Automator</string>
				</array>
				<key>AMParameterProperties</key>
				<dict>
					<key>COMMAND_STRING</key>
					<dict/>
					<key>inputMethod</key>
					<dict/>
					<key>shell</key>
					<dict/>
					<key>source</key>
					<dict/>
				</dict>
				<key>AMProvides</key>
				<dict>
					<key>Container</key>
					<string>List</string>
					<key>Types</key>
					<array>
						<string>com.apple.cocoa-script</string>
					</array>
				</dict>
				<key>ActionBundlePath</key>
				<string>/System/Library/Automator/Run Shell Script.action</string>
				<key>ActionName</key>
				<string>Run Shell Script</string>
				<key>ActionParameters</key>
				<dict>
					<key>COMMAND_STRING</key>
					<string>{esc_cmd}</string>
					<key>inputMethod</key>
					<integer>1</integer>
					<key>shell</key>
					<string>/bin/zsh</string>
					<key>source</key>
					<string></string>
				</dict>
				<key>BundleIdentifier</key>
				<string>com.apple.RunShellScript</string>
				<key>CFBundleVersion</key>
				<string>2.0.3</string>
				<key>CanShowSelectedItemsWhenRun</key>
				<false/>
				<key>CanShowWhenRun</key>
				<true/>
				<key>Category</key>
				<array>
					<string>AMCategoryUtilities</string>
				</array>
				<key>Class Name</key>
				<string>RunShellScriptAction</string>
				<key>InputUUID</key>
				<string>1</string>
				<key>Keywords</key>
				<array>
					<string>Shell</string>
					<string>Script</string>
					<string>Command</string>
					<string>Run</string>
					<string>Unix</string>
				</array>
				<key>OutputUUID</key>
				<string>2</string>
				<key>UUID</key>
				<string>3</string>
				<key>UnlocalizedApplications</key>
				<array>
					<string>Automator</string>
				</array>
				<key>arguments</key>
				<dict>
					<key>0</key>
					<dict>
						<key>default value</key>
						<string>/bin/zsh</string>
						<key>name</key>
						<string>shell</string>
						<key>required</key>
						<string>0</string>
						<key>type</key>
						<string>0</string>
						<key>uuid</key>
						<string>0</string>
					</dict>
					<key>1</key>
					<dict>
						<key>default value</key>
						<integer>0</integer>
						<key>name</key>
						<string>inputMethod</string>
						<key>required</key>
						<string>0</string>
						<key>type</key>
						<string>0</string>
						<key>uuid</key>
						<string>1</string>
					</dict>
					<key>2</key>
					<dict>
						<key>default value</key>
						<string></string>
						<key>name</key>
						<string>source</string>
						<key>required</key>
						<string>0</string>
						<key>type</key>
						<string>0</string>
						<key>uuid</key>
						<string>2</string>
					</dict>
					<key>3</key>
					<dict>
						<key>default value</key>
						<string></string>
						<key>name</key>
						<string>COMMAND_STRING</string>
						<key>required</key>
						<string>0</string>
						<key>type</key>
						<string>0</string>
						<key>uuid</key>
						<string>3</string>
					</dict>
				</dict>
				<key>isViewVisible</key>
				<integer>1</integer>
				<key>location</key>
				<string>309.500000:253.000000</string>
				<key>nibPath</key>
				<string>/System/Library/Automator/Run Shell Script.action/Contents/Resources/Base.lproj/main.nib</string>
			</dict>
			<key>isViewVisible</key>
			<integer>1</integer>
		</dict>
	</array>
	<key>connectors</key>
	<dict/>
	<key>icns</key>
	<data>
	</data>
	<key>name</key>
	<string>{esc_name}</string>
	<key>notesVisible</key>
	<string>YES</string>
	<key>properties</key>
	<dict>
		<key>NSEditorInfo</key>
		<dict/>
	</dict>
	<key>renderingClass</key>
	<string>AMWorkflowRender</string>
	<key>workflowType</key>
	<string>Service</string>
</dict>
</plist>
"#
    )
}

/// Install one Automator Service workflow per action into `~/Library/Services/`,
/// then refresh Launch Services so macOS picks them up immediately.
/// The services appear under right-click → Services when a PDF file is selected.
#[cfg(target_os = "macos")]
fn register_context_menu_macos(app_exe: &str) -> Result<(), String> {
    use std::fs;

    let actions: &[(&str, &str)] = &[
        ("compress", "Compress"),
        ("split", "Split pages"),
        ("merge", "Merge"),
        ("organize", "Organize pages"),
        ("extract-images", "Extract images"),
        ("pdf-to-jpg", "Convert to JPG"),
    ];

    let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
    let services_dir = std::path::PathBuf::from(home).join("Library/Services");
    fs::create_dir_all(&services_dir).map_err(|e| e.to_string())?;

    for (action, label) in actions {
        let workflow_name = format!("Giovanni — {label}");
        let contents_dir = services_dir
            .join(format!("{workflow_name}.workflow"))
            .join("Contents");
        fs::create_dir_all(&contents_dir).map_err(|e| e.to_string())?;

        fs::write(
            contents_dir.join("Info.plist"),
            workflow_info_plist(action, &workflow_name),
        )
        .map_err(|e| e.to_string())?;

        fs::write(
            contents_dir.join("document.wflow"),
            workflow_document(app_exe, action, &workflow_name),
        )
        .map_err(|e| e.to_string())?;
    }

    // Refresh Launch Services so the new workflows are recognised immediately.
    let lsregister = concat!(
        "/System/Library/Frameworks/CoreServices.framework",
        "/Versions/A/Frameworks/LaunchServices.framework",
        "/Versions/A/Support/lsregister"
    );
    let _ = std::process::Command::new(lsregister)
        .args(["-r", &services_dir.to_string_lossy().to_string()])
        .output();

    Ok(())
}

#[cfg(target_os = "macos")]
fn unregister_context_menu_macos() -> Result<(), String> {
    use std::fs;

    let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
    let services_dir = std::path::PathBuf::from(home).join("Library/Services");

    if !services_dir.exists() {
        return Ok(());
    }

    for entry in fs::read_dir(&services_dir)
        .map_err(|e| e.to_string())?
        .flatten()
    {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with("Giovanni") && name_str.ends_with(".workflow") {
            let _ = fs::remove_dir_all(entry.path());
        }
    }

    Ok(())
}

// ── Linux helpers ─────────────────────────────────────────────────────────────

/// Convert an action slug (e.g. "extract-images") to a CamelCase identifier
/// suitable for KDE `.desktop` Action keys (e.g. "ExtractImages").
#[cfg(target_os = "linux")]
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
#[cfg(target_os = "linux")]
fn register_context_menu_linux(app_exe: &str) -> Result<(), String> {
    use std::fs;
    use std::os::unix::fs::PermissionsExt;

    let actions: &[(&str, &str)] = &[
        ("compress", "Compress"),
        ("split", "Split pages"),
        ("merge", "Merge"),
        ("organize", "Organize pages"),
        ("extract-images", "Extract images"),
        ("pdf-to-jpg", "Convert to JPG"),
    ];

    let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
    let home_path = std::path::PathBuf::from(&home);

    // ── Nautilus scripts ──────────────────────────────────────────────────────
    let scripts_dir = home_path.join(".local/share/nautilus/scripts/Giovanni");
    fs::create_dir_all(&scripts_dir).map_err(|e| e.to_string())?;

    for (action, label) in actions {
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

    let action_ids: Vec<String> = actions.iter().map(|(a, _)| kde_action_id(a)).collect();

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

    for (action, label) in actions {
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

#[cfg(target_os = "linux")]
fn unregister_context_menu_linux() -> Result<(), String> {
    use std::fs;

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
            #[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
            if let Ok(exe_path) = std::env::current_exe() {
                let exe_str = exe_path.to_string_lossy().to_string();

                #[cfg(target_os = "windows")]
                if let Err(e) = register_context_menu_windows(&exe_str) {
                    eprintln!("Warning: could not register OS context menu: {e}");
                }

                #[cfg(target_os = "macos")]
                if let Err(e) = register_context_menu_macos(&exe_str) {
                    eprintln!("Warning: could not register OS context menu: {e}");
                }

                #[cfg(target_os = "linux")]
                if let Err(e) = register_context_menu_linux(&exe_str) {
                    eprintln!("Warning: could not register OS context menu: {e}");
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
