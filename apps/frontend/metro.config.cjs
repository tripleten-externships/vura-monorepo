const { getDefaultConfig } = require('@react-native/metro-config');

// Generate the default Metro configuration using the current directory as the project root
const config = getDefaultConfig(__dirname);

module.exports = config;
