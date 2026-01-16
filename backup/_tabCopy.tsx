import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Plus } from "lucide-react-native";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");
const TAB_HEIGHT = 80;

// 1. The SVG Background (Unchanged - it works great)
const TabBarBackground = () => {
  const center = width / 2;
  const holeWidth = 75;
  const holeDepth = 38;

  const d = `
    M0,0 
    L${center - holeWidth},0 
    C${center - holeWidth / 2},0 ${
    center - holeWidth / 2
  },${holeDepth} ${center},${holeDepth} 
    C${center + holeWidth / 2},${holeDepth} ${center + holeWidth / 2},0 ${
    center + holeWidth
  },0 
    L${width},0 
    L${width},${TAB_HEIGHT} 
    L0,${TAB_HEIGHT} 
    Z
  `;

  return (
    <View style={styles.svgContainer}>
      <Svg width={width} height={TAB_HEIGHT}>
        <Path fill="white" d={d} />
      </Svg>
    </View>
  );
};

// 2. The Custom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      <TabBarBackground />

      <View style={styles.tabItemsContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

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

          // SKIP rendering the middle button in the loop
          // We will render it absolutely below to ensure it shows up
          if (route.name === "create-task") {
            // Just render a spacer to keep the other tabs apart
            return <View key={index} style={{ width: 60 }} />;
          }

          // Standard Tabs (Home, Settings)
          const iconName = route.name === "index" ? "home" : "settings";

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Ionicons
                name={isFocused ? iconName : (`${iconName}-outline` as any)}
                size={26}
                color={isFocused ? "#1e293b" : "#94a3b8"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. The Floating Button (Absolutely Positioned) */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => navigation.navigate("create-task")}
        activeOpacity={0.9}
      >
        <Plus color="white" size={32} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="create-task" options={{ title: "Create" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: TAB_HEIGHT,
    backgroundColor: "transparent",
    elevation: 0,
  },
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Add shadow to the white background curve
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabItemsContainer: {
    flexDirection: "row",
    height: "100%",
    alignItems: "flex-start", // Push items to top
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 15, // Push icons down to align nicely
  },
  // FIX: Absolute positioning for the button
  centerButton: {
    position: "absolute",
    left: width / 2 - 30, // Center X: (Screen Width / 2) - (Button Width / 2)
    top: -25, // Center Y: Pull it up
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F43F5E",
    justifyContent: "center",
    alignItems: "center",
    // Shadow for the button
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 50, // Force it on top of everything
  },
});
