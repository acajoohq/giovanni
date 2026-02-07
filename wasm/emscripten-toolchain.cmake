# Emscripten toolchain file for building qpdf to WebAssembly
# This file should be used with: cmake -DCMAKE_TOOLCHAIN_FILE=emscripten-toolchain.cmake

set(CMAKE_SYSTEM_NAME Emscripten)
set(CMAKE_SYSTEM_VERSION 1)

# Set the Emscripten compilers
# These are set by the emsdk environment, but we explicitly define them here
set(CMAKE_C_COMPILER "emcc")
set(CMAKE_CXX_COMPILER "em++")
set(CMAKE_AR "emar" CACHE FILEPATH "Emscripten ar")
set(CMAKE_RANLIB "emranlib" CACHE FILEPATH "Emscripten ranlib")

# Set the target architecture
set(CMAKE_C_COMPILER_TARGET wasm32-unknown-emscripten)
set(CMAKE_CXX_COMPILER_TARGET wasm32-unknown-emscripten)

# Prevent CMake from testing the compiler (requires execution)
set(CMAKE_C_COMPILER_WORKS 1)
set(CMAKE_CXX_COMPILER_WORKS 1)

# Set find root path mode
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Use static libraries only (WASM doesn't use shared libraries)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "Build shared libraries" FORCE)
set(BUILD_STATIC_LIBS ON CACHE BOOL "Build static libraries" FORCE)

# Disable components we don't need for WASM
set(BUILD_DOC OFF CACHE BOOL "Build documentation" FORCE)
set(INSTALL_EXAMPLES OFF CACHE BOOL "Install examples" FORCE)
set(INSTALL_MANUAL OFF CACHE BOOL "Install manual" FORCE)

# Use native crypto provider (no external dependencies)
set(REQUIRE_CRYPTO_NATIVE ON CACHE BOOL "Require native crypto" FORCE)
set(USE_IMPLICIT_CRYPTO OFF CACHE BOOL "Disable implicit crypto" FORCE)
