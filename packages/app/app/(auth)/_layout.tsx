import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{ title: "Sign In", headerShown: false }}
      />
    </Stack>
  );
}
