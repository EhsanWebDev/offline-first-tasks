import { Tabs } from "expo-router";
import {
  CalendarDays,
  Home, // Calendar
  LayoutGrid,
  ListTodo, // Tasks
  NotebookPen, // Notes
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 1. Custom Tab Bar (No FAB)
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  // Filter out hidden routes (href: null) and system routes
  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return options.href !== null && route.name !== "_layout";
  });

  return (
    <View style={styles.container}>
      {/* Black Pill Bar */}
      <View style={styles.tabBar}>
        {visibleRoutes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Icon Mapping
          let IconComponent;
          switch (route.name) {
            case "index":
              IconComponent = Home;
              break;
            case "tasks":
              IconComponent = ListTodo;
              break;
            case "notes":
              IconComponent = NotebookPen;
              break;
            case "calendar":
              IconComponent = CalendarDays;
              break;
            case "more":
              IconComponent = LayoutGrid;
              break;
            default:
              IconComponent = Home;
          }

          const color = isFocused ? "#FFFFFF" : "#666666";

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <IconComponent
                color={color}
                size={22}
                strokeWidth={isFocused ? 2.5 : 2}
              />
              <Text style={[styles.tabLabel, { color }]}>{options.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// 2. Main Layout
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="tasks" options={{ title: "Local DB Inspector" }} />

      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

// 3. Styles
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111111", // Deep Black
    width: "92%",
    height: 70,
    borderRadius: 35,
    bottom: 30, // Floating off bottom
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    flex: 1, // Distribute space evenly
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 4,
    fontWeight: "600",
  },
});
