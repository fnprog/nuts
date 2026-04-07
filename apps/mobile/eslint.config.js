/* eslint-env node */
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'modules/expo-automerge-crdt/rust/target/**/*'],
  },
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);
