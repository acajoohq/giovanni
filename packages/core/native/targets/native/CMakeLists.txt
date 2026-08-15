cmake_minimum_required(VERSION 3.16)

project(giovanni-native
  VERSION 0.1.0
  LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ---------------------------------------------------------------------------
# Paths relative to this file
# ---------------------------------------------------------------------------

set(GIOVANNI_NATIVE_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../..")
set(GIOVANNI_INTERFACE_INCLUDE "${GIOVANNI_NATIVE_ROOT}/interface/include")
set(GIOVANNI_IMPL_QPDF "${GIOVANNI_NATIVE_ROOT}/impl/qpdf")
set(GIOVANNI_IMPL_GHOSTSCRIPT "${GIOVANNI_NATIVE_ROOT}/impl/ghostscript")

# ---------------------------------------------------------------------------
# qpdf dependency
# ---------------------------------------------------------------------------

option(GIOVANNI_USE_SYSTEM_QPDF "Use an installed qpdf (find_package) instead of building from source" OFF)
option(BUILD_SHARED_LIBS "Build giovanni_native as a shared library" OFF)

if(GIOVANNI_USE_SYSTEM_QPDF)
  find_package(qpdf REQUIRED)
  set(GIOVANNI_QPDF_TARGET qpdf::libqpdf)
else()
  set(QPDF_SOURCE_DIR "" CACHE PATH "Path to the qpdf source tree (e.g. <repo-root>/vendor/qpdf)")
  if(NOT QPDF_SOURCE_DIR OR NOT EXISTS "${QPDF_SOURCE_DIR}/CMakeLists.txt")
    message(FATAL_ERROR
      "Set QPDF_SOURCE_DIR, e.g.:\n"
      "  cmake .. -DQPDF_SOURCE_DIR=${GIOVANNI_NATIVE_ROOT}/../../../vendor/qpdf\n"
      "Or use a system qpdf with -DGIOVANNI_USE_SYSTEM_QPDF=ON")
  endif()
  set(BUILD_DOC        OFF CACHE BOOL "" FORCE)
  set(INSTALL_EXAMPLES OFF CACHE BOOL "" FORCE)
  set(INSTALL_MANUAL   OFF CACHE BOOL "" FORCE)
  set(BUILD_STATIC_LIBS ON  CACHE BOOL "" FORCE)
  add_subdirectory("${QPDF_SOURCE_DIR}" "${CMAKE_CURRENT_BINARY_DIR}/qpdf-build" EXCLUDE_FROM_ALL)
  set(GIOVANNI_QPDF_TARGET libqpdf)
endif()

# ---------------------------------------------------------------------------
# Ghostscript dependency (optional)
# ---------------------------------------------------------------------------
# GhostPDL builds with autoconf/make (Linux) or nmake (Windows), not CMake,
# so unlike qpdf it can't be vendored in-tree via add_subdirectory(). Build it
# out-of-tree instead and point CMake at the result:
#
#   Linux   (docker.Dockerfile, ./configure && make libgs)
#     -> a real static archive: set GIOVANNI_GHOSTSCRIPT_LIB to bin/gs.a
#
#   Windows (build-native-windows.ts, nmake -f psi\msvc.mak)
#     -> GhostPDL's MSVC makefile has no static-lib target at all, only
#        gsdll64.dll + its import lib (gsdll64.lib). Set GIOVANNI_GHOSTSCRIPT_LIB
#        to the .lib AND GIOVANNI_GHOSTSCRIPT_DLL to the .dll; giovanni_native
#        links against the import lib and the .dll must ship alongside it at
#        runtime (copied into build/native by build-native-windows.ts).
#
# In both cases GIOVANNI_GHOSTSCRIPT_SOURCE_DIR must point at the GhostPDL
# source tree used to produce the lib, for base/*.h, psi/*.h.
#
# When these aren't supplied, GhostscriptEngine falls back to a stub
# implementation so the rest of the native target keeps building.

set(GIOVANNI_GHOSTSCRIPT_LIB "" CACHE FILEPATH "Path to a prebuilt Ghostscript library: libgs.a (Linux) or gsdll64.lib import lib (Windows)")
set(GIOVANNI_GHOSTSCRIPT_DLL "" CACHE FILEPATH "Windows only: path to gsdll64.dll matching GIOVANNI_GHOSTSCRIPT_LIB")
set(GIOVANNI_GHOSTSCRIPT_SOURCE_DIR "" CACHE PATH "Path to the GhostPDL source tree used to build GIOVANNI_GHOSTSCRIPT_LIB (for base/*.h, psi/*.h)")

set(GIOVANNI_HAVE_GHOSTSCRIPT OFF)
if(GIOVANNI_GHOSTSCRIPT_LIB)
  if(NOT EXISTS "${GIOVANNI_GHOSTSCRIPT_LIB}")
    message(FATAL_ERROR "GIOVANNI_GHOSTSCRIPT_LIB does not exist: ${GIOVANNI_GHOSTSCRIPT_LIB}")
  endif()
  if(NOT GIOVANNI_GHOSTSCRIPT_SOURCE_DIR OR NOT EXISTS "${GIOVANNI_GHOSTSCRIPT_SOURCE_DIR}/psi/iapi.h")
    message(FATAL_ERROR
      "GIOVANNI_GHOSTSCRIPT_LIB is set but GIOVANNI_GHOSTSCRIPT_SOURCE_DIR does not point at "
      "a GhostPDL source tree (missing psi/iapi.h). Set both, e.g.:\n"
      "  cmake .. -DGIOVANNI_GHOSTSCRIPT_LIB=/path/to/bin/gs.a -DGIOVANNI_GHOSTSCRIPT_SOURCE_DIR=/path/to/ghostpdl")
  endif()

  add_library(ghostscript_prebuilt UNKNOWN IMPORTED)
  if(GIOVANNI_GHOSTSCRIPT_DLL)
    if(NOT EXISTS "${GIOVANNI_GHOSTSCRIPT_DLL}")
      message(FATAL_ERROR "GIOVANNI_GHOSTSCRIPT_DLL does not exist: ${GIOVANNI_GHOSTSCRIPT_DLL}")
    endif()
    set_target_properties(ghostscript_prebuilt PROPERTIES
      IMPORTED_LOCATION "${GIOVANNI_GHOSTSCRIPT_DLL}"
      IMPORTED_IMPLIB "${GIOVANNI_GHOSTSCRIPT_LIB}"
      INTERFACE_INCLUDE_DIRECTORIES "${GIOVANNI_GHOSTSCRIPT_SOURCE_DIR}")
  else()
    set_target_properties(ghostscript_prebuilt PROPERTIES
      IMPORTED_LOCATION "${GIOVANNI_GHOSTSCRIPT_LIB}"
      INTERFACE_INCLUDE_DIRECTORIES "${GIOVANNI_GHOSTSCRIPT_SOURCE_DIR}")
  endif()
  set(GIOVANNI_HAVE_GHOSTSCRIPT ON)
endif()

# ---------------------------------------------------------------------------
# giovanni_native — shared/static C library for FFI consumers
# ---------------------------------------------------------------------------

add_library(giovanni_native
  giovanni_c.cc
  ${GIOVANNI_IMPL_QPDF}/qpdf_engine.cc
  ${GIOVANNI_IMPL_GHOSTSCRIPT}/gs_engine.cc)

target_include_directories(giovanni_native
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
    $<INSTALL_INTERFACE:include>
  PRIVATE
    ${GIOVANNI_INTERFACE_INCLUDE}
    ${GIOVANNI_IMPL_QPDF}
    ${GIOVANNI_IMPL_GHOSTSCRIPT})

target_link_libraries(giovanni_native PUBLIC ${GIOVANNI_QPDF_TARGET})

if(GIOVANNI_HAVE_GHOSTSCRIPT)
  target_link_libraries(giovanni_native PUBLIC ghostscript_prebuilt)
  target_compile_definitions(giovanni_native PRIVATE GIOVANNI_HAVE_GHOSTSCRIPT=1)
endif()

# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------

include(GNUInstallDirs)

install(TARGETS giovanni_native
  ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
  LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
  RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})

install(FILES giovanni_c.h DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

# ---------------------------------------------------------------------------
# Tests (CTest)
# ---------------------------------------------------------------------------

enable_testing()

add_executable(giovanni_native_test test/giovanni_native_test.cc)

target_include_directories(giovanni_native_test
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${GIOVANNI_INTERFACE_INCLUDE}
    ${GIOVANNI_IMPL_QPDF})

target_link_libraries(giovanni_native_test PRIVATE giovanni_native)

add_test(NAME giovanni_native_smoke COMMAND giovanni_native_test)
