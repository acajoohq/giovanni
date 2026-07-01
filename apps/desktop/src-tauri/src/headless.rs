use std::path::{Path, PathBuf};

use crate::giovanni::{GiovanniEngine, WriteOptions};
use crate::state::PendingOpenAction;

/// Try to run `action` directly, without opening the Tauri window.
///
/// Returns `true` when the operation completed (successfully) and the caller
/// should exit, or `false` when the action requires the full UI — either because
/// it inherently needs user interaction or because the operation failed (in which
/// case the pending action is kept so the UI can display the error).
pub fn try_run_headless(action: &PendingOpenAction) -> bool {
    if action.open_ui {
        return false;
    }

    match action.action.as_str() {
        "compress" => run_compress(&action.file_path).is_ok(),
        "split" => run_split(&action.file_path).is_ok(),
        // merge needs multiple files, organize/extract-images/pdf-to-jpg need the UI
        _ => false,
    }
}

fn run_compress(file_path: &str) -> Result<(), String> {
    let input = std::fs::read(file_path).map_err(|e| e.to_string())?;

    let engine = GiovanniEngine::new()?;
    let output = engine.write_pdf(&input, Some(&WriteOptions::default()), None)?;

    let out_path = sibling_path(file_path, "compressed", "pdf");
    std::fs::write(&out_path, &output).map_err(|e| e.to_string())?;

    Ok(())
}

fn run_split(file_path: &str) -> Result<(), String> {
    let input = std::fs::read(file_path).map_err(|e| e.to_string())?;

    let engine = GiovanniEngine::new()?;
    let pages = engine.split_pages(&input)?;

    let path = Path::new(file_path);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("pages");
    let parent = path.parent().unwrap_or(Path::new("."));
    let out_dir = parent.join(format!("{stem}_pages"));

    std::fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;

    for (i, page) in pages.iter().enumerate() {
        let out_path = out_dir.join(format!("page_{:03}.pdf", i + 1));
        std::fs::write(&out_path, page).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Build an output path next to `input_path` with `_{suffix}.{ext}` appended to the stem.
/// If a file with that name already exists, appends `_2`, `_3`, … until the path is free.
fn sibling_path(input_path: &str, suffix: &str, ext: &str) -> PathBuf {
    let path = Path::new(input_path);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("output");
    let parent = path.parent().unwrap_or(Path::new("."));

    let candidate = parent.join(format!("{stem}_{suffix}.{ext}"));
    if !candidate.exists() {
        return candidate;
    }

    let mut n = 2u32;
    loop {
        let p = parent.join(format!("{stem}_{suffix}_{n}.{ext}"));
        if !p.exists() {
            return p;
        }
        n += 1;
    }
}
