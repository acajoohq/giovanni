# CMake generated Testfile for 
# Source directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libtests
# Build directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/libtests
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(libtests "perl" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/run-qtest" "--disable-tc" "--top" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/libtests" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/qpdf" "--code" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libtests" "--color" "ON" "--show-on-failure" "OFF" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libtests/*.cc" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libqpdf/*.cc" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libqpdf/qpdf/bits_functions.hh")
set_tests_properties(libtests PROPERTIES  _BACKTRACE_TRIPLES "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libtests/CMakeLists.txt;58;add_test;C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/libtests/CMakeLists.txt;0;")
