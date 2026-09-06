// Android JNI entry point: installs the qpdf JSI binding as globalThis.giovanni.
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace pdfly { namespace jsi { void install(facebook::jsi::Runtime& rt); } }

extern "C" JNIEXPORT void JNICALL
Java_com_giovanni_GiovanniModule_nativeInstall(JNIEnv*, jobject, jlong ptr) {
    auto& rt = *reinterpret_cast<facebook::jsi::Runtime*>(static_cast<uintptr_t>(ptr));
    pdfly::jsi::install(rt);
    // Rename globalThis.pdfly → globalThis.giovanni to match the JS binding
    auto g = rt.global();
    g.setProperty(rt, "giovanni", g.getProperty(rt, "pdfly"));
    g.setProperty(rt, "pdfly", facebook::jsi::Value::undefined());
}