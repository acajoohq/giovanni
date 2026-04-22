cmake_minimum_required(VERSION 3.16)

project(qpdf-wasm
  VERSION 1.0.0
  LANGUAGES C CXX)

# Ensure we're using the Emscripten toolchain
if(NOT EMSCRIPTEN)
  message(FATAL_ERROR "This CMakeLists.txt must be used with the Emscripten toolchain. Use: emcmake cmake -DCMAKE_TOOLCHAIN_FILE=emscripten-toolchain.cmake ..")
endif()

# Set C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Prevent finding system libraries - use Emscripten ports only
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Disable pkg-config to prevent finding homebrew libraries
set(PKG_CONFIG_EXECUTABLE "" CACHE FILEPATH "Disable pkg-config" FORCE)

# Set up Emscripten port locations
# Emscripten ports store headers and libs in the cache directory
set(EMSCRIPTEN_SYSROOT "${EMSCRIPTEN_ROOT_PATH}/cache/sysroot")

# Manually provide zlib and libjpeg paths for qpdf's CMakeLists.txt
# These will be picked up by find_path and find_library
set(ZLIB_H_PATH "${EMSCRIPTEN_SYSROOT}/include" CACHE PATH "zlib include path")
set(ZLIB_LIB_PATH "z" CACHE FILEPATH "zlib library") # Emscripten will resolve this
set(LIBJPEG_H_PATH "${EMSCRIPTEN_SYSROOT}/include" CACHE PATH "libjpeg include path")
set(LIBJPEG_LIB_PATH "jpeg" CACHE FILEPATH "libjpeg library") # Emscripten will resolve this

# Include parent qpdf project (adjust path to point to sibling qpdf directory)
# We'll build libqpdf as a subdirectory
set(qpdf_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../qpdf)
set(qpdf_INCLUDE ${qpdf_SOURCE_DIR}/include)

# Set build options for qpdf library
set(BUILD_SHARED_LIBS OFF CACHE BOOL "Build shared libraries" FORCE)
set(BUILD_STATIC_LIBS ON CACHE BOOL "Build static libraries" FORCE)
set(BUILD_DOC OFF CACHE BOOL "Build documentation" FORCE)
set(INSTALL_EXAMPLES OFF CACHE BOOL "Install examples" FORCE)
set(INSTALL_MANUAL OFF CACHE BOOL "Install manual" FORCE)
set(REQUIRE_CRYPTO_NATIVE ON CACHE BOOL "Require native crypto" FORCE)
set(USE_IMPLICIT_CRYPTO OFF CACHE BOOL "Disable implicit crypto" FORCE)

# Use Emscripten ports for dependencies
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -sUSE_ZLIB=1 -sUSE_LIBJPEG=1")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -sUSE_ZLIB=1 -sUSE_LIBJPEG=1")

# Add parent project (this builds libqpdf)
add_subdirectory(${qpdf_SOURCE_DIR} ${CMAKE_CURRENT_BINARY_DIR}/qpdf-build EXCLUDE_FROM_ALL)

# Create WASM module with Embind bindings
set(QPDF_WASM_SOURCES
  embind/qpdf_wasm_api.cc
  embind/qpdf_bindings.cc
)

add_executable(qpdf-wasm ${QPDF_WASM_SOURCES})

# Link with libqpdf static library
target_link_libraries(qpdf-wasm PRIVATE libqpdf)

# Include directories
target_include_directories(qpdf-wasm PRIVATE
  ${qpdf_INCLUDE}
  ${CMAKE_CURRENT_SOURCE_DIR}
)

# Emscripten-specific flags
set(EMSCRIPTEN_LINK_FLAGS
  -sWASM=1
  -sMODULARIZE=1
  -sEXPORT_NAME='createQpdfModule'
  -sALLOW_MEMORY_GROWTH=1
  -sINITIAL_MEMORY=16MB
  -sMAXIMUM_MEMORY=2GB
  -sSTACK_SIZE=5MB
  -sEXPORT_ES6=1
  -sENVIRONMENT=web,worker,node
  -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8','lengthBytesUTF8']
  -sUSE_ZLIB=1
  -sUSE_LIBJPEG=1
  -lembind
  --no-entry
)

# Add optimization flags
if(CMAKE_BUILD_TYPE STREQUAL "Release")
  list(APPEND EMSCRIPTEN_LINK_FLAGS
    -O3
    -flto
  )
elseif(CMAKE_BUILD_TYPE STREQUAL "Debug")
  list(APPEND EMSCRIPTEN_LINK_FLAGS
    -O0
    -g
    -gsource-map
  )
else()
  # Default to optimized build
  list(APPEND EMSCRIPTEN_LINK_FLAGS
    -O3
    -flto
  )
endif()

# Apply link flags
target_link_options(qpdf-wasm PRIVATE ${EMSCRIPTEN_LINK_FLAGS})

# Set output name
set_target_properties(qpdf-wasm PROPERTIES
  OUTPUT_NAME "qpdf"
  SUFFIX ".js"
)

# Install to build/wasm directory (two levels up from CMake build dir)
install(FILES
  ${CMAKE_CURRENT_BINARY_DIR}/qpdf.js
  ${CMAKE_CURRENT_BINARY_DIR}/qpdf.wasm
  DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/../build/wasm
)
