import { Platform } from "react-native";

const WEB_TOKEN_KEY = "bzfit_token";

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
