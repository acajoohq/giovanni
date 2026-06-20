cmake_minimum_required(VERSION 3.16)

project(pdfly-jsi
  VERSION 0.1.0
  LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ---------------------------------------------------------------------------
# Paths relative to this file
# ---------------------------------------------------------------------------

set(GIOVANNI_NATIVE_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../..")
set(GIOVANNI_INTERFACE_INCLUDE "${GIOVANNI_NATIVE_ROOT}/interface/include")
set(GIOVANNI_IMPL_QPDF "${GIOVANNI_NATIVE_ROOT}/impl/qpdf")

# ---------------------------------------------------------------------------
# JSI headers
#
# Provide the path to the JSI headers from your React Native installation.
# On a typical project this is node_modules/react-native/ReactCommon/jsi.
# ---------------------------------------------------------------------------

set(JSI_INCLUDE_DIR "" CACHE PATH "Path to the directory containing jsi/jsi.h")
if(NOT JSI_INCLUDE_DIR OR NOT EXISTS "${JSI_INCLUDE_DIR}/jsi/jsi.h")
  message(WARNING
    "JSI_INCLUDE_DIR not set or jsi/jsi.h not found.\n"
    "The JSI target will be built without GIOVANNI_JSI_ENABLED — stubs only.\n"
    "Set JSI_INCLUDE_DIR to your react-native ReactCommon directory.")
  set(GIOVANNI_JSI_ENABLED OFF)
else()
  set(GIOVANNI_JSI_ENABLED ON)
endif()

# ---------------------------------------------------------------------------
# qpdf dependency
# ---------------------------------------------------------------------------

option(GIOVANNI_USE_SYSTEM_QPDF "Use an installed qpdf instead of building from source" OFF)

if(GIOVANNI_USE_SYSTEM_QPDF)
  find_package(qpdf REQUIRED)
  set(GIOVANNI_QPDF_TARGET qpdf::libqpdf)
else()
  set(QPDF_SOURCE_DIR "" CACHE PATH "Path to the qpdf source tree")
  if(NOT QPDF_SOURCE_DIR OR NOT EXISTS "${QPDF_SOURCE_DIR}/CMakeLists.txt")
    message(FATAL_ERROR
      "Set QPDF_SOURCE_DIR or use -DGIOVANNI_USE_SYSTEM_QPDF=ON")
  endif()
  set(BUILD_DOC        OFF CACHE BOOL "" FORCE)
  set(INSTALL_EXAMPLES OFF CACHE BOOL "" FORCE)
  set(BUILD_STATIC_LIBS ON  CACHE BOOL "" FORCE)
  add_subdirectory("${QPDF_SOURCE_DIR}" "${CMAKE_CURRENT_BINARY_DIR}/qpdf-build" EXCLUDE_FROM_ALL)
  set(GIOVANNI_QPDF_TARGET libqpdf)
endif()

# ---------------------------------------------------------------------------
# pdfly_jsi — shared library loaded by the React Native bridge
# ---------------------------------------------------------------------------

add_library(pdfly_jsi SHARED
  ${GIOVANNI_IMPL_QPDF}/qpdf_engine.cc)

target_include_directories(pdfly_jsi
  PUBLIC  ${CMAKE_CURRENT_SOURCE_DIR}
  PRIVATE ${GIOVANNI_INTERFACE_INCLUDE}
          ${GIOVANNI_IMPL_QPDF})

if(GIOVANNI_JSI_ENABLED)
  target_include_directories(pdfly_jsi PRIVATE ${JSI_INCLUDE_DIR})
  target_compile_definitions(pdfly_jsi PRIVATE GIOVANNI_JSI_ENABLED=1)
endif()

target_link_libraries(pdfly_jsi PRIVATE ${GIOVANNI_QPDF_TARGET})
