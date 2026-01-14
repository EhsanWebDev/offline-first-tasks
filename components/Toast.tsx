import { View, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      className="absolute bottom-12 self-center bg-gray-900 px-6 py-3 rounded-full opacity-90 shadow-lg z-50"
    >
      <Text className="text-white font-medium text-sm">{message}</Text>
    </Animated.View>
  );
}
