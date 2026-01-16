import { useThemeStore } from "@/store/themeStore";
import { Moon, Sun } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function HomeHeader() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const { theme, toggleTheme } = useThemeStore();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  return (
    <View className="flex-row justify-between items-center px-6 pt-2 pb-6 bg-white">
      <View>
        <Text className="text-3xl font-bold text-gray-900">My Tasks</Text>
        <Text className="text-gray-500 text-base mt-1">{currentDate}</Text>
      </View>
      <View className="p-2 bg-gray-50 rounded-full border border-gray-100">
        <TouchableOpacity
          onPress={toggleTheme}
          className="flex-row items-center justify-center  rounded-full"
        >
          {theme === "light" ? (
            <Moon color="black" size={20} strokeWidth={2.5} />
          ) : (
            <Sun color="black" size={20} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      {/* <TouchableOpacity className="p-2 bg-gray-50 rounded-full border border-gray-100">
        <Bell size={24} color="#1F2937" strokeWidth={2} />
      </TouchableOpacity> */}
    </View>
  );
}
