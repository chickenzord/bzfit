import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createContext, useContext, useState } from "react";

const TabBarContext = createContext<{ setHidden: (hidden: boolean) => void }>({
  setHidden: () => {},
});

export function useTabBarHidden() {
  return useContext(TabBarContext);
}

export default function TabsLayout() {
  const [hidden, setHidden] = useState(false);

  return (
    <TabBarContext.Provider value={{ setHidden }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: hidden
            ? { display: "none" }
            : {
                backgroundColor: "#0f172a",
                borderTopColor: "#1e293b",
              },
          headerStyle: {
            backgroundColor: "#0f172a",
          },
          headerTintColor: "#f8fafc",
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="catalog"
          options={{
            title: "Catalog",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{ href: null }}
        />
      </Tabs>
    </TabBarContext.Provider>
  );
}
