import { Stack } from "expo-router";

export default function CatalogLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Food Catalog" }} />
    </Stack>
  );
}
