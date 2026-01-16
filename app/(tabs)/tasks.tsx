import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const tasks = (props: any) => {
  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1">
        <Text className="text-2xl font-bold text-gray-900">Tasks</Text>
      </View>
    </SafeAreaView>
  );
};

export default tasks;
