# CMake generated Testfile for 
# Source directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/examples
# Build directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/examples
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(examples "perl" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/run-qtest" "--disable-tc" "--top" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/examples" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/qpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/compare-for-test" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/libqpdf" "--code" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/examples" "--color" "ON" "--show-on-failure" "OFF" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/examples/*.cc" "--tc" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/examples/*.c")
set_tests_properties(examples PROPERTIES  _BACKTRACE_TRIPLES "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/examples/CMakeLists.txt;42;add_test;C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/examples/CMakeLists.txt;0;")
