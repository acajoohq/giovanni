cmake_minimum_required(VERSION 3.16)

project(qpdf-wasm
  VERSION 1.0.0
  LANGUAGES C CXX)

if(NOT EMSCRIPTEN)
  message(FATAL_ERROR "This CMakeLists.txt must be used with the Emscripten toolchain. Use: emcmake cmake -DCMAKE_TOOLCHAIN_FILE=toolchains/emscripten.cmake ..")
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

set(PKG_CONFIG_EXECUTABLE "" CACHE FILEPATH "Disable pkg-config" FORCE)

set(EMSCRIPTEN_SYSROOT "${EMSCRIPTEN_ROOT_PATH}/cache/sysroot")

set(ZLIB_H_PATH "${EMSCRIPTEN_SYSROOT}/include" CACHE PATH "zlib include path")
set(ZLIB_LIB_PATH "z" CACHE FILEPATH "zlib library")
set(LIBJPEG_H_PATH "${EMSCRIPTEN_SYSROOT}/include" CACHE PATH "libjpeg include path")
set(LIBJPEG_LIB_PATH "jpeg" CACHE FILEPATH "libjpeg library")

set(QPDF_SOURCE_DIR "" CACHE PATH "qpdf source directory")
if(NOT QPDF_SOURCE_DIR OR NOT EXISTS "${QPDF_SOURCE_DIR}/CMakeLists.txt")
  message(FATAL_ERROR "QPDF_SOURCE_DIR must point to an unpacked qpdf source tree")
endif()
set(qpdf_SOURCE_DIR ${QPDF_SOURCE_DIR})
set(qpdf_INCLUDE ${qpdf_SOURCE_DIR}/include)

set(BUILD_SHARED_LIBS OFF CACHE BOOL "Build shared libraries" FORCE)
set(BUILD_STATIC_LIBS ON CACHE BOOL "Build static libraries" FORCE)
set(BUILD_DOC OFF CACHE BOOL "Build documentation" FORCE)
set(INSTALL_EXAMPLES OFF CACHE BOOL "Install examples" FORCE)
set(INSTALL_MANUAL OFF CACHE BOOL "Install manual" FORCE)
set(REQUIRE_CRYPTO_NATIVE ON CACHE BOOL "Require native crypto" FORCE)
set(USE_IMPLICIT_CRYPTO OFF CACHE BOOL "Disable implicit crypto" FORCE)

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -sUSE_ZLIB=1 -sUSE_LIBJPEG=1")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -sUSE_ZLIB=1 -sUSE_LIBJPEG=1")

add_subdirectory(${qpdf_SOURCE_DIR} ${CMAKE_CURRENT_BINARY_DIR}/qpdf-build EXCLUDE_FROM_ALL)

set(PDFLY_NATIVE_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/..)

set(QPDF_WASM_SOURCES
  bindings/emscripten/bindings.cc
  bindings/emscripten/api/qpdf_commons.cc
  bindings/emscripten/api/compress.cc
  bindings/emscripten/api/split.cc
  bindings/emscripten/api/merge.cc
  bindings/emscripten/api/extract_images.cc
  bindings/emscripten/api/qpdf_wrapper.cc
  ${PDFLY_NATIVE_ROOT}/impl/qpdf/qpdf_engine.cc
)

add_executable(qpdf-wasm ${QPDF_WASM_SOURCES})

target_link_libraries(qpdf-wasm PRIVATE libqpdf)

target_include_directories(qpdf-wasm PRIVATE
  ${qpdf_INCLUDE}
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${PDFLY_NATIVE_ROOT}/interface/include
  ${PDFLY_NATIVE_ROOT}/impl/qpdf
)

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
  list(APPEND EMSCRIPTEN_LINK_FLAGS
    -O3
    -flto
  )
endif()

target_link_options(qpdf-wasm PRIVATE ${EMSCRIPTEN_LINK_FLAGS})

set_target_properties(qpdf-wasm PROPERTIES
  OUTPUT_NAME "qpdf"
  SUFFIX ".js"
)
