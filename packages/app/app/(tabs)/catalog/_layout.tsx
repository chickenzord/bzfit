import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Icon } from "../../../lib/icons";

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
      <Stack.Screen
        name="index"
        options={{
          title: "Food Catalog",
          headerRight: () => (
            <Pressable onPress={() => router.push("/catalog/foods/new")}>
              <Icon name="plus" size={24} color="#3b82f6" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="foods/new"
        options={{
          title: "New Food",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="chevron-left" size={24} color="#f8fafc" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="foods/[id]/index"
        options={{
          title: "Food Details",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="chevron-left" size={24} color="#f8fafc" />
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
              <Icon name="chevron-left" size={24} color="#f8fafc" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="foods/[id]/servings/new"
        options={{
          title: "New Serving",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="chevron-left" size={24} color="#f8fafc" />
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
              <Icon name="chevron-left" size={24} color="#f8fafc" />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
