use std::path::PathBuf;
use std::env;

fn main() {
     // Path folder of the native library
    let mut lib_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    lib_dir.pop();
    lib_dir.pop();
    lib_dir.pop();
    lib_dir.push("packages\\core\\build\\native");

    println!("cargo:warning=Recherche de la lib dans : {:?}", lib_dir.display());

    if !lib_dir.exists() {
        panic!("ERREUR : Le dossier n'existe pas !");
    }

    println!("cargo:rustc-link-search=native={}", lib_dir.display());
    println!("cargo:rustc-link-lib=static=giovanni_native");

    #[cfg(target_os = "macos")]
    println!("cargo:rustc-link-lib=dylib=c++");

    #[cfg(target_os = "linux")]
    println!("cargo:rustc-link-lib=dylib=stdc++");

    println!("cargo:rerun-if-changed=build.rs");

    tauri_build::build()
}
