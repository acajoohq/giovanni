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

    #[cfg(windows)]
    {
        // build:native:win copies qpdf and its vcpkg deps into build/native/
        // alongside giovanni_native.lib. Link every .lib found there except
        // giovanni_native itself (already linked above).
        for entry in std::fs::read_dir(&lib_dir).unwrap().flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("lib") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    if stem != "giovanni_native" {
                        println!("cargo:rustc-link-lib=static={stem}");
                    }
                }
            }
        }

        // Windows system libs required by qpdf / OpenSSL at final link time.
        // These are OS import libs and cannot be bundled into a static archive.
        println!("cargo:rustc-link-lib=Crypt32");
        println!("cargo:rustc-link-lib=Wldap32");
        println!("cargo:rustc-link-lib=bcrypt");
    }

    #[cfg(target_os = "linux")]
    {
        // Link libqpdf.a (and any other .a deps exported from the Docker build)
        // alongside libgiovanni_native.a into build/native/.
        for entry in std::fs::read_dir(&lib_dir).unwrap().flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("a") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    let name = stem.strip_prefix("lib").unwrap_or(stem);
                    if name != "giovanni_native" {
                        println!("cargo:rustc-link-lib=static={name}");
                    }
                }
            }
        }
        // System libs qpdf links against — available on any Linux with the dev packages.
        println!("cargo:rustc-link-lib=z");
        println!("cargo:rustc-link-lib=jpeg");
        println!("cargo:rustc-link-lib=ssl");
        println!("cargo:rustc-link-lib=crypto");
        println!("cargo:rustc-link-lib=dylib=stdc++");
    }

    #[cfg(target_os = "macos")]
    println!("cargo:rustc-link-lib=dylib=c++");

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed={}", lib_file.display());

    tauri_build::build()
}
