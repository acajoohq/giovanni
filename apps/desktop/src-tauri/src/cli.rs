use crate::state::PendingOpenAction;

/// Parse `--action <name> --file <path>` from the process arguments.
/// These are set by the OS context menu command registered in the registry.
pub fn parse_pending_action() -> Option<PendingOpenAction> {
    let args: Vec<String> = std::env::args().collect();
    let mut action: Option<String> = None;
    let mut file_path: Option<String> = None;

    let mut open_ui = false;
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
            "--open-ui" => {
                open_ui = true;
                i += 1;
            }
            _ => {
                i += 1;
            }
        }
    }

    match (action, file_path) {
        (Some(action), Some(file_path)) => Some(PendingOpenAction { action, file_path, open_ui }),
        _ => None,
    }
}
