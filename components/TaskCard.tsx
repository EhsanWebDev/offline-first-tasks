import { Calendar, Check, MessageCircle } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { PRIORITY_COLORS } from "../constants/colors";
import { formatDate } from "../utils/dateHelpers";

export type Priority = "low" | "medium" | "high";

interface TaskCardProps {
  title: string;
  description?: string;
  isCompleted?: boolean;
  priority?: Priority;
  onToggle?: () => void;
  onPress?: () => void;
  createdAt?: number;
  dueDate?: number;
  commentsCount?: number;
}

export default function TaskCard({
  title,
  description = "",
  isCompleted = false,
  priority = "medium",
  onToggle,
  onPress,
  createdAt,
  dueDate,
  commentsCount = 0,
}: TaskCardProps) {
  const colors =
    PRIORITY_COLORS[priority?.toLowerCase() as Priority] ||
    PRIORITY_COLORS.medium;

  // Show due date if available, otherwise show created date
  const dateStr = dueDate
    ? formatDate(new Date(dueDate))
    : createdAt
    ? formatDate(new Date(createdAt))
    : "Today";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`p-5 rounded-3xl mb-4 shadow-sm`}
      style={{ backgroundColor: colors.lightBg }}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-4">
          <Text
            className={`text-xl font-bold text-gray-900 mb-1 ${
              isCompleted ? "line-through text-gray-500" : ""
            }`}
            numberOfLines={2}
          >
            {title}
          </Text>
          {description ? (
            <Text className="text-gray-600 text-sm mb-4" numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>

        {/* Toggle Button / Checkbox */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
            isCompleted
              ? "bg-white border-white opacity-50"
              : "bg-white border-white/50"
          }`}
        >
          {isCompleted ? (
            <Check size={20} color="#000" strokeWidth={3} />
          ) : (
            <View
              className="w-3 h-3 rounded-full opacity-30"
              style={{ backgroundColor: colors.solid }}
            />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        {/* Priority Pill */}
        <View className="flex-row items-center gap-2">
          <View className="bg-white/80 px-4 py-2 rounded-xl">
            <Text
              className="font-bold capitalize"
              style={{ color: colors.solid }}
            >
              {priority}
            </Text>
          </View>
          {commentsCount > 0 && (
            <View className="flex-row items-center gap-1 bg-white/80 px-4 py-2 rounded-xl">
              <MessageCircle size={14} color="#000" />
              <Text className="font-bold text-xs text-gray-900">
                {commentsCount}
              </Text>
            </View>
          )}
        </View>

        {/* Date */}
        <View className="flex-row items-center opacity-60">
          <Calendar size={14} color="#000" className="mr-1" />
          <Text className="text-xs font-medium text-gray-900 ml-1">
            {dateStr}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
