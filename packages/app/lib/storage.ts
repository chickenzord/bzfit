import { Platform } from "react-native";

const WEB_TOKEN_KEY = "bzfit_token";
const WEB_API_URL_KEY = "bzfit_api_url";
const WEB_THEME_KEY = "bzfit_theme";

export type ThemePreference = "light" | "dark" | "system";

async function getSecureStore() {
  if (Platform.OS === "web") return null;
  return await import("expo-secure-store");
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(WEB_TOKEN_KEY);
  }
  const SecureStore = await getSecureStore();
  return SecureStore?.getItemAsync("token") ?? null;
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(WEB_TOKEN_KEY, token);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore?.setItemAsync("token", token);
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(WEB_TOKEN_KEY);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore?.deleteItemAsync("token");
}

export async function getCustomApiUrl(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(WEB_API_URL_KEY);
  }
  const SecureStore = await getSecureStore();
  return SecureStore?.getItemAsync("api_url") ?? null;
}

export async function setCustomApiUrl(url: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(WEB_API_URL_KEY, url);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore?.setItemAsync("api_url", url);
}

export async function removeCustomApiUrl(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(WEB_API_URL_KEY);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore?.deleteItemAsync("api_url");
}

export async function getThemePreference(): Promise<ThemePreference | null> {
  if (Platform.OS === "web") {
    return (localStorage.getItem(WEB_THEME_KEY) as ThemePreference) ?? null;
  }
  const SecureStore = await getSecureStore();
  return ((await SecureStore?.getItemAsync("theme")) as ThemePreference) ?? null;
}

export async function setThemePreference(theme: ThemePreference): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(WEB_THEME_KEY, theme);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore?.setItemAsync("theme", theme);
}
