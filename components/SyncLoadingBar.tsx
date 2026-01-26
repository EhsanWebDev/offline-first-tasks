import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SyncLoadingBarProps {
  isVisible: boolean;
}

export default function SyncLoadingBar({ isVisible }: SyncLoadingBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Reset and start animation
      progress.value = 0;
      progress.value = withRepeat(
        withTiming(1, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // Infinite repeat
        false,
      );
    } else {
      // Stop animation
      progress.value = 0;
    }
  }, [isVisible, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: progress.value * 400 - 100, // Slide from -100 to 300
        },
      ],
    };
  });

  if (!isVisible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: "#E5E7EB",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            height: 3,
            width: 100,
            backgroundColor: "#4F46E5",
            borderRadius: 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
