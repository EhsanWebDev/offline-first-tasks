import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  // ios liquid glass tab bar effect
  const iosLiquidGlassTabBarEffect = {
    tabBarTransparent: true,
    tabBarBlurEffect: "light",
    tabBarStyle: {
      backgroundColor: "transparent",
    },
  };
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        ...iosLiquidGlassTabBarEffect,
        headerStyle: {
          backgroundColor: "transparent",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings-sharp" : "settings-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
