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

    if !lib_dir.exists() {
        panic!(
            "Native library directory not found: {}\n\
             Run `pnpm --filter @giovanni/core build:native` first.",
            lib_dir.display()
        );
    }

    println!("cargo:rustc-link-search=native={}", lib_dir.display());
    println!("cargo:rustc-link-lib=static=giovanni_native");

    #[cfg(target_os = "macos")]
    println!("cargo:rustc-link-lib=dylib=c++");

    #[cfg(target_os = "linux")]
    println!("cargo:rustc-link-lib=dylib=stdc++");

    println!("cargo:rerun-if-changed=build.rs");
    println!(
        "cargo:rerun-if-changed={}",
        lib_dir.join("libgiovanni_native.a").display()
    );

    tauri_build::build()
}
