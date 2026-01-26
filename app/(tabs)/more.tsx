import { useQuery } from "@/db/realm";
import { JsonTask } from "@/db/realm/schemas/Json/Task";
import { useRouter } from "expo-router";
import { ChevronRight, Cloud, Upload } from "lucide-react-native";
import { FC, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MoreScreen: FC = () => {
  const router = useRouter();

  // Get pending tasks count from Realm
  const pendingTasks = useQuery<JsonTask>(JsonTask).filtered(
    "sync_status == $0 OR sync_status == $1 OR sync_status == $2",
    "pending_creation",
    "pending_update",
    "sync_error",
  );

  const pendingCount = useMemo(() => pendingTasks.length, [pendingTasks]);

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">More</Text>

        {/* Sync Queue Menu Item */}
        <TouchableOpacity
          onPress={() => router.push("/sync")}
          className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm mb-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-4">
            {pendingCount > 0 ? (
              <Upload size={20} color="#4F46E5" />
            ) : (
              <Cloud size={20} color="#4F46E5" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Sync Queue
            </Text>
            <Text className="text-sm text-gray-500">
              {pendingCount > 0
                ? `${pendingCount} change${pendingCount !== 1 ? "s" : ""} pending`
                : "All synced"}
            </Text>
          </View>

          {pendingCount > 0 && (
            <View className="bg-indigo-600 rounded-full w-6 h-6 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">
                {pendingCount > 99 ? "99+" : pendingCount}
              </Text>
            </View>
          )}

          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MoreScreen;
