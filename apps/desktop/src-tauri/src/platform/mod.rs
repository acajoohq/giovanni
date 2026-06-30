/// Actions that run instantly without opening the app window (headless).
pub const HEADLESS_ACTIONS: &[(&str, &str)] = &[
    ("compress", "Compress PDF"),
    ("split", "Split pages"),
];

/// Actions that open the app UI.
pub const UI_ACTIONS: &[(&str, &str)] = &[
    ("compress", "Compress PDF"),
    ("split", "Split pages"),
    ("merge", "Merge PDFs"),
    ("organize", "Organize pages"),
    ("extract-images", "Extract images"),
    ("pdf-to-jpg", "Convert to JPG"),
];

/// All actions combined — used by platforms that don't support group separation.
pub const ACTIONS: &[(&str, &str)] = &[
    ("compress", "Compress PDF"),
    ("split", "Split pages"),
    ("merge", "Merge PDFs"),
    ("organize", "Organize pages"),
    ("extract-images", "Extract images"),
    ("pdf-to-jpg", "Convert to JPG"),
];

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;
