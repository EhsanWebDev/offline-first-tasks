import { Priority } from "@/api/types/tasks";
import { PRIORITY_COLORS } from "@/constants/colors";
import { PressableScale } from "pressto";
import { Text, View } from "react-native";

type PriorityBarProps = {
  priority: Priority;
  setPriority: (priority: Priority) => void;
  isPending: boolean;
};
const PriorityBar = ({
  priority,
  setPriority,
  isPending,
}: PriorityBarProps) => {
  return (
    <View className="mb-8">
      <Text className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
        Priority Level
      </Text>
      <View className="flex-row justify-between">
        {(["low", "medium", "high"] as Priority[]).map((p) => {
          const colors = PRIORITY_COLORS[p];
          const isSelected = priority === p;

          return (
            <PressableScale
              key={p}
              onPress={() => setPriority(p)}
              enabled={!isPending}
              style={{
                backgroundColor: isSelected ? colors.lightBg : "#F9FAFB",
                borderColor: isSelected ? colors.solid : "transparent",
                flex: 1,
                height: 48,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.solid }}
                />
                <Text
                  className="font-bold capitalize text-base"
                  style={{ color: isSelected ? colors.solid : "#4B5563" }}
                >
                  {p}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
};

export default PriorityBar;
