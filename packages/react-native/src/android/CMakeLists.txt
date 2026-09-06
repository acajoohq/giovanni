cmake_minimum_required(VERSION 3.18)
project(giovanni-react-native)
set(CMAKE_CXX_STANDARD 20)

set(RN_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../node_modules/react-native")
# Pre-built JSI library produced by pnpm build:jsi
set(JSI_BUILD_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../build/jsi")

add_library(pdfly_jsi SHARED IMPORTED)
set_target_properties(pdfly_jsi PROPERTIES
    IMPORTED_LOCATION ${JSI_BUILD_DIR}/libpdfly_jsi.so)

add_library(giovanni-react-native SHARED GiovanniModule.cpp)

target_include_directories(giovanni-react-native PRIVATE
    ${RN_DIR}/ReactCommon/jsi
    ${RN_DIR}/ReactCommon
    ${JSI_BUILD_DIR}
)

find_package(fbjni REQUIRED CONFIG)
target_link_libraries(giovanni-react-native fbjni::fbjni pdfly_jsi android log)