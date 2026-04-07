const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, 'modules/expo-automerge-crdt')];

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['require', 'react-native'],
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, 'modules')],
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './app/uniwind-types.d.ts',
});
