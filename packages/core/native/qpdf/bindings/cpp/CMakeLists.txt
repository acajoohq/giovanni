cmake_minimum_required(VERSION 3.16)

project(giovanni-qpdf-cpp
  VERSION 0.1.0
  LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ---------------------------------------------------------------------------
# Paths relative to this file
# ---------------------------------------------------------------------------

set(GIOVANNI_NATIVE_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../../..")
set(GIOVANNI_INTERFACE_INCLUDE "${GIOVANNI_NATIVE_ROOT}/interface/include")
set(GIOVANNI_IMPL_QPDF "${GIOVANNI_NATIVE_ROOT}/impl/qpdf")

# ---------------------------------------------------------------------------
# qpdf dependency
# ---------------------------------------------------------------------------
#
# Option A (default): build qpdf from source
#   cmake .. -DQPDF_SOURCE_DIR=<workspace-root>/vendor/qpdf
#
# Option B: use an installed qpdf
#   cmake .. -DGIOVANNI_USE_SYSTEM_QPDF=ON

option(GIOVANNI_USE_SYSTEM_QPDF "Find qpdf via find_package instead of building from source" OFF)
option(BUILD_SHARED_LIBS "Build giovanni_qpdf as a shared library" OFF)

if(GIOVANNI_USE_SYSTEM_QPDF)
  find_package(qpdf REQUIRED)
  set(GIOVANNI_QPDF_TARGET qpdf::libqpdf)
else()
  set(QPDF_SOURCE_DIR "" CACHE PATH "Path to the qpdf source tree (vendor/qpdf)")
  if(NOT QPDF_SOURCE_DIR OR NOT EXISTS "${QPDF_SOURCE_DIR}/CMakeLists.txt")
    message(FATAL_ERROR
      "Set QPDF_SOURCE_DIR to the qpdf source directory, e.g.:\n"
      "  cmake .. -DQPDF_SOURCE_DIR=${GIOVANNI_NATIVE_ROOT}/../vendor/qpdf\n"
      "Or use an installed qpdf with -DGIOVANNI_USE_SYSTEM_QPDF=ON")
  endif()
  set(BUILD_DOC        OFF CACHE BOOL "" FORCE)
  set(INSTALL_EXAMPLES OFF CACHE BOOL "" FORCE)
  set(INSTALL_MANUAL   OFF CACHE BOOL "" FORCE)
  set(BUILD_STATIC_LIBS ON  CACHE BOOL "" FORCE)
  add_subdirectory(
    "${QPDF_SOURCE_DIR}"
    "${CMAKE_CURRENT_BINARY_DIR}/qpdf-build"
    EXCLUDE_FROM_ALL)
  set(GIOVANNI_QPDF_TARGET libqpdf)
endif()

# ---------------------------------------------------------------------------
# giovanni_qpdf -- C++ free-function library
# ---------------------------------------------------------------------------

add_library(giovanni_qpdf
  giovanni_qpdf.cc
  ${GIOVANNI_IMPL_QPDF}/qpdf_engine.cc)

target_include_directories(giovanni_qpdf
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
  PRIVATE
    ${GIOVANNI_INTERFACE_INCLUDE}
    ${GIOVANNI_IMPL_QPDF})

target_link_libraries(giovanni_qpdf PUBLIC ${GIOVANNI_QPDF_TARGET})

# ---------------------------------------------------------------------------
# Optional example executable
# ---------------------------------------------------------------------------

option(GIOVANNI_BUILD_EXAMPLE "Build the usage example" OFF)

if(GIOVANNI_BUILD_EXAMPLE)
  add_executable(giovanni_example example/main.cc)
  target_link_libraries(giovanni_example PRIVATE giovanni_qpdf)
endif()

# ---------------------------------------------------------------------------
# Install rules
# ---------------------------------------------------------------------------

include(GNUInstallDirs)

install(TARGETS giovanni_qpdf
  ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
  LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
  RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})

install(DIRECTORY include/
  DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})
