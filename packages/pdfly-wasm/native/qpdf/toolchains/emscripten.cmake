# Emscripten toolchain file for building qpdf to WebAssembly
# This file should be used with: cmake -DCMAKE_TOOLCHAIN_FILE=toolchains/emscripten.cmake

set(CMAKE_SYSTEM_NAME Emscripten)
set(EMSCRIPTEN 1 CACHE BOOL "Building with Emscripten" FORCE)
set(CMAKE_SYSTEM_VERSION 1)

if(NOT CMAKE_C_COMPILER)
  set(CMAKE_C_COMPILER "emcc")
endif()
if(NOT CMAKE_CXX_COMPILER)
  set(CMAKE_CXX_COMPILER "em++")
endif()
if(NOT CMAKE_AR)
  set(CMAKE_AR "emar" CACHE FILEPATH "Emscripten ar")
endif()
if(NOT CMAKE_RANLIB)
  set(CMAKE_RANLIB "emranlib" CACHE FILEPATH "Emscripten ranlib")
endif()

set(CMAKE_C_COMPILER_TARGET wasm32-unknown-emscripten)
set(CMAKE_CXX_COMPILER_TARGET wasm32-unknown-emscripten)
set(CMAKE_SIZEOF_VOID_P 4 CACHE STRING "Size of a pointer" FORCE)

set(CMAKE_C_COMPILER_WORKS 1)
set(CMAKE_CXX_COMPILER_WORKS 1)

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

set(BUILD_SHARED_LIBS OFF CACHE BOOL "Build shared libraries" FORCE)
set(BUILD_STATIC_LIBS ON CACHE BOOL "Build static libraries" FORCE)

set(BUILD_DOC OFF CACHE BOOL "Build documentation" FORCE)
set(INSTALL_EXAMPLES OFF CACHE BOOL "Install examples" FORCE)
set(INSTALL_MANUAL OFF CACHE BOOL "Install manual" FORCE)

set(REQUIRE_CRYPTO_NATIVE ON CACHE BOOL "Require native crypto" FORCE)
set(USE_IMPLICIT_CRYPTO OFF CACHE BOOL "Disable implicit crypto" FORCE)
