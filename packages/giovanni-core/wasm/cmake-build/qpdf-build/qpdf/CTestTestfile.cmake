# CMake generated Testfile for 
# Source directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/qpdf
# Build directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/qpdf
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(qpdf "perl" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/run-qtest" "--disable-tc" "--top" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/qpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/libqpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/compare-for-test" "--env" "CMAKE_BINARY_DIR=C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build" "--code" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/qpdf" "--color" "ON" "--show-on-failure" "OFF" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/qpdf/*.cc" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/qpdf/*.c" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libqpdf/*.cc")
set_tests_properties(qpdf PROPERTIES  _BACKTRACE_TRIPLES "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/qpdf/CMakeLists.txt;51;add_test;C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/qpdf/CMakeLists.txt;0;")
