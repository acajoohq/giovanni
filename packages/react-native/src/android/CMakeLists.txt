cmake_minimum_required(VERSION 3.16)
project(giovanni-react-native)

set(CMAKE_CXX_STANDARD 20)

set(PDFLY_NATIVE_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../../packages/core/native")
set(JSI_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../node_modules/react-native/ReactCommon")

add_library(giovanni-react-native SHARED
    GiovanniModule.cpp
    ${PDFLY_NATIVE_ROOT}/targets/jsi/qpdf/qpdf_jsi.cpp
    ${PDFLY_NATIVE_ROOT}/impl/qpdf/qpdf_engine.cc
)

target_include_directories(giovanni-react-native PRIVATE
    ${JSI_INCLUDE_DIR}
    ${PDFLY_NATIVE_ROOT}/interface/include
    ${PDFLY_NATIVE_ROOT}/impl/qpdf
    ${PDFLY_NATIVE_ROOT}/targets/jsi/qpdf
)

target_compile_definitions(giovanni-react-native PRIVATE PDFLY_JSI_ENABLED=1)

find_package(fbjni REQUIRED CONFIG)
find_library(LOG_LIB log)

target_link_libraries(giovanni-react-native
    fbjni::fbjni
    ${LOG_LIB}
    android
)
