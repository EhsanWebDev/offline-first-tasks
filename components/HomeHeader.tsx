import { useThemeStore } from "@/store/themeStore";
import { Moon, RefreshCw, Sun } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface HomeHeaderProps {
  onSyncPress?: () => void;
  isSyncing?: boolean;
}

export default function HomeHeader({
  onSyncPress,
  isSyncing = false,
}: HomeHeaderProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }
  }, [isSyncing, rotation]);
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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View className="flex-row justify-between items-center px-6 pt-2 pb-6 bg-white">
      <View>
        <Text className="text-3xl font-bold text-gray-900">My Tasks</Text>
        <Text className="text-gray-500 text-base mt-1">{currentDate}</Text>
      </View>

      <View className="flex-row gap-2">
        {/* Sync Button */}
        <TouchableOpacity
          onPress={onSyncPress}
          disabled={isSyncing}
          className="p-2 bg-gray-50 rounded-full border border-gray-100"
          style={{ opacity: isSyncing ? 0.6 : 1 }}
        >
          <Animated.View style={animatedStyle}>
            <RefreshCw color="black" size={20} strokeWidth={2.5} />
          </Animated.View>
        </TouchableOpacity>

        {/* Theme Toggle */}
        <View className="p-2 bg-gray-50 rounded-full border border-gray-100">
          <TouchableOpacity
            onPress={toggleTheme}
            className="flex-row items-center justify-center rounded-full"
          >
            {theme === "light" ? (
              <Moon color="black" size={20} strokeWidth={2.5} />
            ) : (
              <Sun color="black" size={20} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
