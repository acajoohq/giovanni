// iOS TurboModule: installs the qpdf JSI binding as globalThis.giovanni.
#import "GiovanniModule.h"
#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>
#import <jsi/jsi.h>

namespace pdfly { namespace jsi { void install(facebook::jsi::Runtime& rt); } }

@implementation GiovanniModule

RCT_EXPORT_MODULE(GiovanniModule)

- (void)installJSI {
    RCTBridge *bridge = [RCTBridge currentBridge];
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
    if (!cxxBridge.runtime) return;

    auto &rt = *(facebook::jsi::Runtime *)cxxBridge.runtime;
    pdfly::jsi::install(rt);
    // Rename globalThis.pdfly -> globalThis.giovanni to match the JS binding
    auto g = rt.global();
    g.setProperty(rt, "giovanni", g.getProperty(rt, "pdfly"));
    g.setProperty(rt, "pdfly", facebook::jsi::Value::undefined());
}

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(install:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [self installJSI];
    resolve(@YES);
}

@end