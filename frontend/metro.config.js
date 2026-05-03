const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix: transform react-native-reanimated ESM (import.meta) for web
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
};

// Ensure reanimated is transformed (not treated as CJS)
const { assetExts, sourceExts } = config.resolver;
config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg', 'cjs', 'mjs'];

module.exports = config;
