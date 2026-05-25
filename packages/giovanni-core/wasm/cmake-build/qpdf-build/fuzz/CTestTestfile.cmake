# CMake generated Testfile for 
# Source directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/fuzz
# Build directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/fuzz
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(fuzz "perl" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/run-qtest" "--disable-tc" "--env" "QPDF_FUZZ_CORPUS=C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/fuzz/qpdf_corpus" "--top" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/fuzz" "--bin" "C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build/qpdf" "--code" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/fuzz" "--color" "ON" "--show-on-failure" "OFF")
set_tests_properties(fuzz PROPERTIES  _BACKTRACE_TRIPLES "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/fuzz/CMakeLists.txt;199;add_test;C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/fuzz/CMakeLists.txt;0;")
