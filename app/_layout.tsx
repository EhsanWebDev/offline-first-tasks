import queryClient from "@/api";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-task"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
