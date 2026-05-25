// pdfly_native_test.cc — CTest smoke test for libpdfly_native
//
// Verifies the C FFI lifecycle:
//   pdfly_qpdf_create  → pdfly_get_version  → pdfly_qpdf_destroy
//
// Run via:  ctest --output-on-failure --test-dir native/targets/native/build

#include "../pdfly_c.h"

#include <cstdio>
#include <cstring>

static int fail(const char* msg, PdflyQpdfHandle h) {
    fprintf(stderr, "FAILED: %s\n", msg);
    if (h) pdfly_qpdf_destroy(h);
    return 1;
}

int main() {
    // 1. Create engine handle
    PdflyQpdfHandle h = pdfly_qpdf_create();
    if (!h) return fail("pdfly_qpdf_create returned null", nullptr);

    // 2. Retrieve qpdf version string
    char version[64] = {};
    if (pdfly_get_version(h, version, sizeof(version)) != 0)
        return fail("pdfly_get_version returned non-zero", h);
    if (strlen(version) == 0)
        return fail("version string is empty", h);

    printf("pdfly_native: qpdf version = %s\n", version);

    // 3. Destroy handle — must not crash or leak
    pdfly_qpdf_destroy(h);

    printf("pdfly_native smoke test: PASSED\n");
    return 0;
}
