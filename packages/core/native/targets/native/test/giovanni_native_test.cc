// giovanni_native_test.cc — CTest smoke test for libgiovanni_native
//
// Verifies the C FFI lifecycle:
//   giovanni_qpdf_create  → giovanni_get_version  → giovanni_qpdf_destroy
//
// Run via:  ctest --output-on-failure --test-dir native/targets/native/build

#include "../giovanni_c.h"

#include <cstdio>
#include <cstring>

static int fail(const char* msg, PdflyQpdfHandle h) {
    fprintf(stderr, "FAILED: %s\n", msg);
    if (h) giovanni_qpdf_destroy(h);
    return 1;
}

int main() {
    // 1. Create engine handle
    PdflyQpdfHandle h = giovanni_qpdf_create();
    if (!h) return fail("giovanni_qpdf_create returned null", nullptr);

    // 2. Retrieve qpdf version string
    char version[64] = {};
    if (giovanni_get_version(h, version, sizeof(version)) != 0)
        return fail("giovanni_get_version returned non-zero", h);
    if (strlen(version) == 0)
        return fail("version string is empty", h);

    printf("giovanni_native: qpdf version = %s\n", version);

    // 3. Destroy handle — must not crash or leak
    giovanni_qpdf_destroy(h);

    printf("giovanni_native smoke test: PASSED\n");
    return 0;
}
