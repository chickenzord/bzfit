import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CatalogLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Food Catalog" }} />
      <Stack.Screen
        name="foods/[id]/index"
        options={{
          title: "Food Details",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#f8fafc" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="foods/[id]/edit"
        options={{
          title: "Edit Food",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#f8fafc" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="servings/[id]"
        options={{
          title: "Edit Serving",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#f8fafc" />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
