use std::env;
use std::path::PathBuf;

fn main() {
    // Resolve workspace root: src-tauri → desktop → apps → workspace root
    let mut lib_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    lib_dir.pop(); // desktop
    lib_dir.pop(); // apps
    lib_dir.pop(); // workspace root
    lib_dir.push("packages");
    lib_dir.push("core");
    lib_dir.push("build");
    lib_dir.push("native");

    // MSVC names static archives <target>.lib; GNU/Clang use lib<target>.a
    #[cfg(windows)]
    let lib_file = lib_dir.join("giovanni_native.lib");
    #[cfg(not(windows))]
    let lib_file = lib_dir.join("libgiovanni_native.a");

    if !lib_file.exists() {
        #[cfg(windows)]
        let build_cmd = "pnpm --filter @giovanni/core build:native:win";
        #[cfg(not(windows))]
        let build_cmd = "pnpm --filter @giovanni/core build:native";

        panic!(
            "Native library not found: {}\nBuild it first:\n  {}",
            lib_file.display(),
            build_cmd,
        );
    }

    println!("cargo:rustc-link-search=native={}", lib_dir.display());
    println!("cargo:rustc-link-lib=static=giovanni_native");

    #[cfg(target_os = "macos")]
    println!("cargo:rustc-link-lib=dylib=c++");

    #[cfg(target_os = "linux")]
    println!("cargo:rustc-link-lib=dylib=stdc++");

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed={}", lib_file.display());

    tauri_build::build()
}
