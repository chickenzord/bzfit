const isDev = process.env.APP_ENV === "development";

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: isDev ? "BzFit (Dev)" : "BzFit",
    slug: "bzfit",
    version: "0.1.0",
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
      versionCode: 10000,
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router", "expo-secure-store", "expo-system-ui"],
    extra: {
      router: {},
      eas: {
        projectId: "38135bc5-de7c-4946-a24b-14452ff6b472",
      },
    },
    owner: "akhyrul",
  },
};
