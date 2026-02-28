const pkg = require("../../package.json");
const isDev = process.env.APP_ENV === "development";

// APP_BUILD is the rebuild counter (default 0). Set by CI via env var or
// locally when building a specific rebuild of the same semver.
const build = parseInt(process.env.APP_BUILD ?? "0", 10);

function deriveVersionCode(version, build = 0) {
  const [major, minor, patch] = version.split(".").map(Number);
  return major * 1000000 + minor * 10000 + patch * 100 + build;
}

const version = pkg.version;
const versionCode = deriveVersionCode(version, build);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: isDev ? "BzFit (Dev)" : "BzFit",
    slug: "bzfit",
    version,
    scheme: "bzfit",
    orientation: "portrait",
    icon: isDev ? "./assets/icon-dev.png" : "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#020617",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: isDev ? "dev.akhy.bzfit.dev" : "dev.akhy.bzfit",
      versionCode,
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router", "expo-secure-store", "expo-system-ui"],
    extra: {
      build,
      router: {},
      eas: {
        projectId: "38135bc5-de7c-4946-a24b-14452ff6b472",
      },
    },
    owner: "akhyrul",
  },
};
