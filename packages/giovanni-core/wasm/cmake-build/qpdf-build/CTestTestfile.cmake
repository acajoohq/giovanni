# CMake generated Testfile for 
# Source directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf
# Build directory: C:/Users/edwar/Documents/Repos/qpdf-wasm/packages/pdfly-wasm/wasm/cmake-build/qpdf-build
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(check-assert "perl" "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/check_assert")
set_tests_properties(check-assert PROPERTIES  _BACKTRACE_TRIPLES "C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/CMakeLists.txt;371;add_test;C:/Users/edwar/Documents/Repos/qpdf-wasm/vendor/qpdf/CMakeLists.txt;0;")
subdirs("include")
subdirs("libqpdf")
subdirs("compare-for-test")
subdirs("qpdf")
subdirs("libtests")
subdirs("examples")
subdirs("zlib-flate")
subdirs("manual")
subdirs("fuzz")
