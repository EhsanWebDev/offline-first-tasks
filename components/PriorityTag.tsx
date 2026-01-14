import { View, Text } from "react-native";

export type Priority = "low" | "medium" | "high";

interface PriorityTagProps {
  priority: Priority;
}

const styles = {
  high: { bg: "bg-red-100", text: "text-red-800" },
  medium: { bg: "bg-amber-100", text: "text-amber-800" },
  low: { bg: "bg-blue-100", text: "text-blue-800" },
};

export default function PriorityTag({ priority }: PriorityTagProps) {
  const normalizedPriority = (
    ["low", "medium", "high"].includes(priority?.toLowerCase())
      ? priority.toLowerCase()
      : "medium"
  ) as Priority;

  const style = styles[normalizedPriority];

  return (
    <View className={`${style.bg} px-3 py-1 rounded-md self-start border-0`}>
      <Text className={`${style.text} text-xs font-bold capitalize`}>
        {normalizedPriority}
      </Text>
    </View>
  );
}
