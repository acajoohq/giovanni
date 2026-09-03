cmake_minimum_required(VERSION 3.16)

project(giovanni-jsi-gs
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
set(GIOVANNI_IMPL_GHOSTSCRIPT "${GIOVANNI_NATIVE_ROOT}/impl/ghostscript")

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
    "The Ghostscript JSI target will be built without GIOVANNI_JSI_ENABLED — stubs only.\n"
    "Set JSI_INCLUDE_DIR to your react-native ReactCommon directory.")
  set(GIOVANNI_JSI_ENABLED OFF)
else()
  set(GIOVANNI_JSI_ENABLED ON)
endif()

# ---------------------------------------------------------------------------
# Ghostscript dependency (optional)
#
# Point GIOVANNI_GHOSTSCRIPT_LIB at a prebuilt Ghostscript library and
# GIOVANNI_GHOSTSCRIPT_SOURCE_DIR at the GhostPDL source tree (for headers).
# Without these the GhostscriptEngine will be a stub (getVersion returns "").
# ---------------------------------------------------------------------------

set(GIOVANNI_GHOSTSCRIPT_LIB "" CACHE FILEPATH
  "Path to a prebuilt Ghostscript library: libgs.a (Linux) or gsdll64.lib (Windows)")
set(GIOVANNI_GHOSTSCRIPT_DLL "" CACHE FILEPATH
  "Windows only: path to gsdll64.dll matching GIOVANNI_GHOSTSCRIPT_LIB")
set(GIOVANNI_GHOSTSCRIPT_SOURCE_DIR "" CACHE PATH
  "Path to the GhostPDL source tree used to build GIOVANNI_GHOSTSCRIPT_LIB")

set(GIOVANNI_HAVE_GHOSTSCRIPT OFF)
if(GIOVANNI_GHOSTSCRIPT_LIB AND EXISTS "${GIOVANNI_GHOSTSCRIPT_LIB}")
  if(GIOVANNI_GHOSTSCRIPT_SOURCE_DIR AND EXISTS "${GIOVANNI_GHOSTSCRIPT_SOURCE_DIR}/psi/iapi.h")
    set(GIOVANNI_HAVE_GHOSTSCRIPT ON)
  else()
    message(WARNING
      "GIOVANNI_GHOSTSCRIPT_LIB is set but GIOVANNI_GHOSTSCRIPT_SOURCE_DIR "
      "does not point at a valid GhostPDL source tree (missing psi/iapi.h).\n"
      "Building without Ghostscript support.")
  endif()
endif()

# ---------------------------------------------------------------------------
# giovanni_jsi_gs — shared library loaded by the React Native bridge
# ---------------------------------------------------------------------------

add_library(giovanni_jsi_gs SHARED
  ${GIOVANNI_IMPL_GHOSTSCRIPT}/gs_engine.cc)

target_include_directories(giovanni_jsi_gs
  PUBLIC  ${CMAKE_CURRENT_SOURCE_DIR}
  PRIVATE ${GIOVANNI_INTERFACE_INCLUDE}
          ${GIOVANNI_IMPL_GHOSTSCRIPT})

if(GIOVANNI_JSI_ENABLED)
  target_include_directories(giovanni_jsi_gs PRIVATE ${JSI_INCLUDE_DIR})
  target_compile_definitions(giovanni_jsi_gs PRIVATE GIOVANNI_JSI_ENABLED=1)
endif()

if(GIOVANNI_HAVE_GHOSTSCRIPT)
  target_compile_definitions(giovanni_jsi_gs PRIVATE GIOVANNI_HAVE_GHOSTSCRIPT=1)
  target_include_directories(giovanni_jsi_gs PRIVATE ${GIOVANNI_GHOSTSCRIPT_SOURCE_DIR})
  target_link_libraries(giovanni_jsi_gs PRIVATE ${GIOVANNI_GHOSTSCRIPT_LIB})
  if(WIN32 AND GIOVANNI_GHOSTSCRIPT_DLL)
    add_custom_command(TARGET giovanni_jsi_gs POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${GIOVANNI_GHOSTSCRIPT_DLL}" $<TARGET_FILE_DIR:giovanni_jsi_gs>
      COMMENT "Copying gsdll64.dll alongside giovanni_jsi_gs")
  endif()
endif()