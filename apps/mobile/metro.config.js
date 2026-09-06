const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...(config.resolver.sourceExts ?? []), 'mjs'];

const mockBindings = path.resolve(__dirname, './src/mock/bindings-B7G6DnhU.mjs');

// Redirect the WASM binding loader (uses dynamic import that Metro cannot handle) to the JSI mock
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('bindings-B7G6DnhU.mjs')) {
    return { filePath: mockBindings, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;