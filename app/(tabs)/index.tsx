import { Priority } from "@/api/types/tasks";
import HomeHeader from "@/components/HomeHeader";
import SyncLoadingBar from "@/components/SyncLoadingBar";
import { updateTaskWithSyncStatus } from "@/db/queries/taskApi";
import { useQuery, useRealm } from "@/db/realm";
import { JsonTask } from "@/db/realm/schemas/Json/Task";
import { Task } from "@/db/realm/schemas/Task";
import { SyncManager } from "@/services/SyncManager";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { PressableScale } from "pressto";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusFilter, { FilterStatus } from "../../components/StatusFilter";
import TaskCard from "../../components/TaskCard";
import Toast from "../../components/Toast";
import { mySync } from "../../utils/sync";

const HomeScreen = () => {
  const router = useRouter();
  const realm = useRealm();

  // Get all tasks from Realm (live query)
  const tasks = useQuery<JsonTask>(JsonTask).filtered(
    "sync_status != 'pending_delete'",
  );

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All Tasks");
  const [isSyncing, setIsSyncing] = useState(false);

  // const onRefresh = useCallback(() => {
  //   setRefreshing(true);
  //   refetchTasks();
  //   setTimeout(() => {
  //     setRefreshing(false);
  //   }, 1200);
  // }, [refetchTasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const handleRefresh = useCallback(async () => {
    setIsSyncing(true);
    try {
      // First: Push any local changes UP
      await SyncManager.processSyncQueue(realm);

      // Second: Pull any remote changes DOWN
      await SyncManager.pullFromCloud(realm);
    } catch (error) {
      Alert.alert("Sync Error", "Could not update tasks.");
    } finally {
      setIsSyncing(false);
    }
  }, [realm]);

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      console.log("Starting sync...");
      await mySync(realm);
      console.log("Sync completed successfully");
      showToast("✓ Tasks synced successfully");
    } catch (error) {
      console.error("Sync error:", error);
      showToast("✗ Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleTask = async (task: JsonTask) => {
    const newStatus = !task.is_completed;

    await updateTaskWithSyncStatus(realm, task, {
      is_completed: newStatus,
    });

    showToast(newStatus ? "Task completed" : "Task updated");
  };

  const filteredTasks = useMemo(() => {
    const tasksArray = Array.from(tasks);
    if (filter === "All Tasks") return tasksArray;
    if (filter === "Ongoing") return tasksArray.filter((t) => !t.is_completed);
    if (filter === "Completed") return tasksArray.filter((t) => t.is_completed);
    return tasksArray;
  }, [tasks, filter]);

  const counts = useMemo(() => {
    const tasksArray = Array.from(tasks);
    return {
      all: tasksArray.length,
      ongoing: tasksArray.filter((t) => !t.is_completed).length,
      completed: tasksArray.filter((t) => t.is_completed).length,
    };
  }, [tasks]);

  const renderItem = ({ item, index }: { item: Task; index: number }) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        layout={FadeInDown.springify()}
      >
        <TaskCard
          title={item.title}
          description={item.description ?? ""}
          isCompleted={item.is_completed}
          priority={item.priority as Priority}
          commentsCount={item.commentsCount ?? item.comments?.length ?? 0}
          mediaCount={item.mediaCount ?? item.media?.length ?? 0}
          createdAt={
            item.created_at ? new Date(item.created_at).getTime() : undefined
          }
          dueDate={
            item.due_date ? new Date(item.due_date).getTime() : undefined
          }
          onToggle={() => handleToggleTask(item)}
          onPress={() => router.push(`/edit-task/${item._id}`)}
        />
      </Animated.View>
    );
  };

  const handleCreateTask = async () => {
    // Generate a Temporary Negative ID
    // Using Date.now() ensures uniqueness locally.
    // We negate it to distinguish from real DB IDs.
    const tempId = -Date.now();

    const newTaskData = {
      _id: tempId,
      title: "New Task From Local DB",
      description: "This is a new task from Local DB",
      due_date: new Date().toISOString(),
      is_completed: true,
      priority: "high",
      created_at: new Date().toISOString(),
      images: [],
      media_count: 0,
      comments_count: 0,
      sync_status: "pending_creation",
    };

    // 1. Optimistic Save (Instant UI update)
    realm.write(() => {
      realm.create("JsonTask", newTaskData);
    });

    // 2. Trigger Sync Background Process
    // In a real app, this should be in a useEffect or a queue system
    // try {
    //   await SyncManager.processSyncQueue(realm);
    //   showToast("✓ Task created successfully");
    // } catch (error) {
    //   console.error("Sync error:", error);
    //   showToast("✗ Sync failed. Please try again.");
    // }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <SyncLoadingBar isVisible={isSyncing} />

      {/* <StatusBar style="dark" /> */}
      <View className="flex-1">
        <HomeHeader onSyncPress={handleRefresh} isSyncing={isSyncing} />

        <StatusFilter
          currentFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        {/* Data List */}
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-400 text-lg">
                {filter === "Completed"
                  ? "No completed tasks yet"
                  : "No tasks found"}
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 180,
            // paddingTop: 10,
            flexGrow: 1, // Ensures empty state stays centered
          }}
          showsVerticalScrollIndicator={false}
          // refreshControl={
          //   <RefreshControl
          //     refreshing={refreshing}
          //     onRefresh={onRefresh}
          //     tintColor="#4F46E5" // iOS spinner color
          //     colors={["#4F46E5"]} // Android spinner color
          //   />
          // }
        />
      </View>

      <Toast message={toastMessage} visible={toastVisible} />

      <PressableScale
        // onPress={() => router.push("/create-task")}
        onPress={handleCreateTask}
        style={{
          position: "absolute",
          bottom: 110,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Plus color="white" size={30} strokeWidth={2.5} />
      </PressableScale>
    </SafeAreaView>
  );
};

export default HomeScreen;
