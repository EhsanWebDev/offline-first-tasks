import { useUpdateTask } from "@/api/tasks/mutations";
import { useTasks } from "@/api/tasks/queries";
import { Priority, Task } from "@/api/types/tasks";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Plus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../components/HomeHeader";
import StatusFilter, { FilterStatus } from "../../components/StatusFilter";
import TaskCard from "../../components/TaskCard";
import Toast from "../../components/Toast";

export default function HomeScreen() {
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All Tasks");

  const {
    data: tasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useTasks();

  const { mutate: updateTaskMutation } = useUpdateTask();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchTasks();
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  }, [refetchTasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const handleToggleTask = (task: Task) => {
    const newStatus = !task.is_completed;

    updateTaskMutation(
      {
        title: task.title,
        priority: task.priority as "low" | "medium" | "high",
        description: task.description ?? undefined,
        due_date: task.due_date ?? undefined,
        id: task.id,
        is_completed: newStatus,
      },
      {
        onSuccess: () => {
          showToast(newStatus ? "Task completed " : "Task updated");
        },
        onError: (error) => {
          console.error(error);
        },
      }
    );
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (filter === "All Tasks") return tasks;
    if (filter === "Ongoing") return tasks.filter((t) => !t.is_completed);
    if (filter === "Completed") return tasks.filter((t) => t.is_completed);
    return tasks;
  }, [tasks, filter]);

  const counts = useMemo(
    () => ({
      all: (tasks ?? []).length,
      ongoing: (tasks ?? []).filter((t) => !t.is_completed).length,
      completed: (tasks ?? []).filter((t) => t.is_completed).length,
    }),
    [tasks]
  );

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <StatusBar style="dark" />
      <View className="flex-1">
        <HomeHeader />

        <StatusFilter
          currentFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        {/* Task List Area */}
        {tasksLoading ? (
          // Loading View
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-gray-400 mt-4 font-medium">
              Loading your tasks...
            </Text>
          </View>
        ) : (
          // Data List
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                layout={FadeInDown.springify()}
              >
                <TaskCard
                  title={item.title}
                  description={item.description ?? ""}
                  isCompleted={item.is_completed}
                  priority={item.priority as Priority}
                  createdAt={item.created_at}
                  dueDate={item.due_date ?? undefined}
                  onToggle={() => handleToggleTask(item)}
                  onPress={() => router.push(`/edit-task/${item.id}`)}
                />
              </Animated.View>
            )}
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
              paddingBottom: 100,
              paddingTop: 10,
              flexGrow: 1, // Ensures empty state stays centered
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4F46E5" // iOS spinner color
                colors={["#4F46E5"]} // Android spinner color
              />
            }
          />
        )}
      </View>

      <Toast message={toastMessage} visible={toastVisible} />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 bg-gray-900 rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.8}
        onPress={() => router.push("/create-task")}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus color="white" size={30} strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
