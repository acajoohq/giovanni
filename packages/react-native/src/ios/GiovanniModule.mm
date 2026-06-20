// GiovanniModule.mm - iOS TurboModule that installs the giovanni JSI globals
// Called by React Native during app startup.

#import "GiovanniModule.h"
#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>
#import <jsi/jsi.h>

// giovanni JSI install function (from targets/jsi/qpdf)
#ifdef GIOVANNI_JSI_ENABLED
#include "qpdf_jsi.h"
#endif

@implementation GiovanniModule

RCT_EXPORT_MODULE(GiovanniModule)

- (void)installJSI {
#ifdef GIOVANNI_JSI_ENABLED
    RCTBridge *bridge = [RCTBridge currentBridge];
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
    if (!cxxBridge.runtime) return;

    auto &rt = *(facebook::jsi::Runtime *)cxxBridge.runtime;
    giovanni::jsi::install(rt);
#endif
}

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(install:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [self installJSI];
    resolve(@YES);
}

@end
