const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ["ts", "tsx", "js", "jsx", "json", "mjs"];
config.resolver.assetExts = ["png", "jpg", "jpeg", "gif", "svg"];

// 处理 expo-notifications 的依赖问题
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./app/global.css" });
