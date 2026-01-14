import { View, Text, Image, TouchableOpacity } from "react-native";
import { Bell } from "lucide-react-native";

export default function HomeHeader() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <View className="flex-row justify-between items-center px-6 pt-2 pb-6 bg-white">
      <View>
        <Text className="text-3xl font-bold text-gray-900">My Tasks</Text>
        <Text className="text-gray-500 text-base mt-1">{currentDate}</Text>
      </View>

      <TouchableOpacity className="p-2 bg-gray-50 rounded-full border border-gray-100">
        <Bell size={24} color="#1F2937" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
