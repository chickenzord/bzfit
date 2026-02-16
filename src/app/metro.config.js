const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(projectRoot);

// Watch shared types from monorepo
config.watchFolders = [path.resolve(monorepoRoot, "src/shared")];

// Resolve modules from both app and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
