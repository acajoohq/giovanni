# CMake generated Testfile for 
# Source directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/compare-for-test
# Build directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/compare-for-test
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(compare-for-test "perl" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/run-qtest" "--disable-tc" "--top" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/compare-for-test" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/libqpdf" "--code" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/compare-for-test" "--color" "ON" "--show-on-failure" "OFF" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/compare-for-test/*.cc")
set_tests_properties(compare-for-test PROPERTIES  _BACKTRACE_TRIPLES "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/compare-for-test/CMakeLists.txt;6;add_test;C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/compare-for-test/CMakeLists.txt;0;")
