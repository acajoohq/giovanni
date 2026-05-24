use std::fs;

/// Escapes a string for embedding in an XML plist text node.
fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// `Info.plist` content for a single Automator Service workflow.
/// The `NSSendFileTypes` key restricts the service to PDF files only.
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
pub fn register(app_exe: &str) -> Result<(), String> {
    let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
    let services_dir = std::path::PathBuf::from(home).join("Library/Services");
    fs::create_dir_all(&services_dir).map_err(|e| e.to_string())?;

    for (action, label) in super::ACTIONS {
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

pub fn unregister() -> Result<(), String> {
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
