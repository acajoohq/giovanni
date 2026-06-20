// GiovanniModule.cpp � Android JNI/JSI entry point
// Calls pdfly::jsi::install(rt) from the JNI_OnLoad or JSI installer method.

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvokerHolder.h>

#ifdef GIOVANNI_JSI_ENABLED
#include "qpdf_jsi.h"
#endif

extern "C" JNIEXPORT void JNICALL
Java_com_giovanni_GiovanniModule_nativeInstall(JNIEnv* env, jobject /* this */, jlong jsRuntimePointer) {
#ifdef GIOVANNI_JSI_ENABLED
    auto* rt = reinterpret_cast<facebook::jsi::Runtime*>(jsRuntimePointer);
    pdfly::jsi::install(*rt);
#endif
}
