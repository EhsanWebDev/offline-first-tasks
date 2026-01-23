import { useUpdateTask } from "@/api/tasks/mutations";
import { useTasks } from "@/api/tasks/queries";
import { Priority } from "@/api/types/tasks";
import HomeHeader from "@/components/HomeHeader";
import { default as Task, default as TaskModel } from "@/db/model/Task";
import { withObservables } from '@nozbe/watermelondb/react';
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { PressableScale } from "pressto";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusFilter, { FilterStatus } from "../../components/StatusFilter";
import TaskCard from "../../components/TaskCard";
import Toast from "../../components/Toast";
import { database, tasksCollection } from "../../db";

 const HomeScreen = ({ tasks }: { tasks: TaskModel[] }) => {
  const router = useRouter();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All Tasks");

  const {
    isLoading: tasksLoading,
  } = useTasks();

  const { mutate: updateTaskMutation } = useUpdateTask();

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

  const handleToggleTask = async (task: Task) => {
    const newStatus = !task.is_completed;

    await database.write(async () => {
      await task.update((t) => {
        t.is_completed = newStatus;
      });
    });

    // updateTaskMutation(
    //   {
    //     title: task.title,
    //     priority: task.priority as "low" | "medium" | "high",
    //     description: task.description ?? undefined,
    //     due_date: task.due_date ?? undefined,
    //     id: task.id,
    //     is_completed: newStatus,
    //   },
    //   {
    //     onSuccess: () => {
    //       showToast(newStatus ? "Task completed " : "Task updated");
    //     },
    //     onError: (error) => {
    //       console.error(error);
    //     },
    //   }
    // );
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
          commentsCount={item.task_comments?.[0]?.count ?? 0}
          mediaCount={item.task_media?.[0]?.count ?? 0}
          createdAt={
            item.created_at ? new Date(item.created_at).getTime() : undefined
          }
          dueDate={
            item.due_date ? new Date(item.due_date).getTime() : undefined
          }
          onToggle={() => handleToggleTask(item)}
          onPress={() => router.push(`/edit-task/${item.id}`)}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      {/* <StatusBar style="dark" /> */}
      <View className="flex-1">
        <HomeHeader />

        <StatusFilter
          currentFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

       
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
        )}
      </View>

      <Toast message={toastMessage} visible={toastVisible} />

    
      <PressableScale
        onPress={() => router.push("/create-task")}
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
 }

 const enhance = withObservables([], () => ({
  tasks: tasksCollection.query().observeWithColumns(['title', 'description', 'is_completed', 'priority', 'created_at', 'due_date'])
}));
 const EnhancedHomeScreen = enhance(HomeScreen);
 export default EnhancedHomeScreen;
