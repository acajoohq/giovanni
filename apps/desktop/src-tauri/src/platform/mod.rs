pub const ACTIONS: &[(&str, &str)] = &[
    ("compress", "Compress"),
    ("split", "Split pages"),
    ("merge", "Merge"),
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
