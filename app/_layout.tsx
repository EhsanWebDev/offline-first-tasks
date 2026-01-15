import queryClient from "@/api";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="create-task"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
