import { useTaskCommentsByTaskId } from "@/api/tasks/comments/queries";
import { useTaskMediaByTaskId } from "@/api/tasks/media/queries";
import { useDeleteTask, useUpdateTask } from "@/api/tasks/mutations";
import { useTaskById } from "@/api/tasks/queries";
import Header from "@/components/AppHeaders/Header";
import PriorityBar from "@/components/PriorityBar";
import { Priority } from "@/components/PriorityTag";
import AppInput from "@/components/TextInput/AppInput";
import { formatDate } from "@/utils/dateHelpers";
import {
  deleteImageFromSupabase,
  uploadImageToSupabase,
} from "@/utils/imageUpload";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  ImageIcon,
  MessageCircle,
  Save,
  Trash2,
  X,
} from "lucide-react-native";
import { PressableScale } from "pressto";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  // Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function EditTaskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  const { data: comments } = useTaskCommentsByTaskId(Number(id));
  const { data: media } = useTaskMediaByTaskId(Number(id));
  const commentsCount = comments?.length ?? 0;
  const mediaCount = media?.length ?? 0;
  const hasComments = commentsCount > 0;
  const hasMedia = media?.length && media?.length > 0;
  const { mutate: updateTaskMutation, isPending } = useUpdateTask();
  const { data: theTask, isLoading: isTaskLoading } = useTaskById(id as string);

  // Extract is_completed to preserve it during update
  const is_completed = theTask?.[0]?.is_completed ?? false;
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { mutate: removeTaskMutation, isPending: isRemoveTaskPending } =
    useDeleteTask();

  useEffect(() => {
    if (theTask && !isTaskLoading) {
      setTitle(theTask[0].title || "");
      setDescription(theTask[0].description || "");
      setPriority((theTask[0].priority as Priority) || "medium");
      setDueDate(theTask[0].due_date ?? null);
      setImageUrl(theTask[0].image_url ?? null);
    }
  }, [theTask, isTaskLoading]);

  const handleUpdate = async () => {
    setIsLoading(true);
    let imageUrlFromSupabase = null;
    if (imageUrl) {
      imageUrlFromSupabase = await uploadImageToSupabase(imageUrl);
    }
    updateTaskMutation(
      {
        id: id as string,
        title: title.trim(),
        description: description?.trim(),
        priority: priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        is_completed: is_completed,
        image_url: imageUrlFromSupabase ?? undefined,
      },
      {
        onSuccess: () => {
          setIsLoading(false);
          router.back();
        },
        onError: (error) => {
          console.error(error);
          Alert.alert("Error", (error as Error).message);
          setIsLoading(false);
        },
      }
    );
    setIsLoading(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          removeTaskMutation(id as string, {
            onSuccess: async () => {
              if (imageUrl) {
                const deleted = await deleteImageFromSupabase(imageUrl);
                if (deleted) {
                  setImageUrl(null);
                }
              }
              queryClient.invalidateQueries({ queryKey: ["tasks"] });
              router.back();
            },
            onError: (error) => {
              console.error(error);
              Alert.alert("Error", (error as Error).message);
            },
          });
        },
      },
    ]);
  };
  // Handler for Android Date Picker
  const onAndroidDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Store as milliseconds
      setDueDate(selectedDate.getTime());
    }
  };

  // Handler for iOS Date Picker
  const onIOSDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      // Store as milliseconds
      setDueDate(selectedDate.getTime());
    }
  };

  const handleChangeImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      // delete the old image from supabase
      if (imageUrl) {
        const deleted = await deleteImageFromSupabase(imageUrl);
        if (deleted) {
          setImageUrl(null);
        }
      }
      const imageUrlFromSupabase = await uploadImageToSupabase(
        result.assets[0].uri
      );
      setImageUrl(imageUrlFromSupabase);
      updateTaskMutation(
        {
          id: id as string,
          image_url: imageUrlFromSupabase ?? undefined,
          title: title.trim(),
          description: description?.trim(),
          priority: priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          is_completed: is_completed,
        },
        {
          onSuccess: () => {
            router.back();
          },
          onError: (error) => {
            console.error(error);
            Alert.alert("Error", (error as Error).message);
          },
        }
      );
    }
  };

  if (isTaskLoading) {
    return (
      <SafeAreaView className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ChevronLeft size={28} color="#1E293B" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-gray-900">
              Edit Task
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isRemoveTaskPending}
            className="p-2"
          >
            {isRemoveTaskPending ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Trash2 size={22} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-400 text-lg">Loading your task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Header
          title="Edit Task"
          onBackPress={() => router.back()}
          headerRight={
            <PressableScale
              onPress={handleDelete}
              enabled={!isRemoveTaskPending}
              style={{
                backgroundColor: "rgba(0,0,0,0.05)",
                borderRadius: 100,
                padding: 8,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isRemoveTaskPending ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Trash2 size={24} color="#EF4444" />
              )}
            </PressableScale>
          }
        />

        <ScrollView
          className="flex-1 px-6 pt-6"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Project Title */}
          <AppInput
            label="Title"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (errors.title) setErrors({});
            }}
            placeholder="Enter task title"
            placeholderTextColor="#94A3B8"
            error={errors.title ? "Title is required" : undefined}
          />
          <View className="mb-6" />

          {/* Description */}
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description"
            placeholderTextColor="#94A3B8"
            error={errors.description ? "Description is required" : undefined}
            multiline
            textAlignVertical="top"
          />
          <View className="mb-6" />
          {/* Due Date */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Due Date (Optional)
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-14"
            >
              <Calendar size={20} color="#94A3B8" />
              <Text
                className={`flex-1 ml-3 text-base ${
                  dueDate ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {dueDate ? formatDate(dueDate) : "Select due date"}
              </Text>

              {/* Clear Button */}
              {dueDate && (
                <TouchableOpacity
                  onPress={() => setDueDate(null)}
                  className="p-1"
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={dueDate ? new Date(dueDate) : new Date()}
                mode="date"
                display="default"
                onChange={onAndroidDateChange}
              />
            )}
          </View>

          {/* Priority */}
          <PriorityBar
            priority={priority}
            setPriority={setPriority}
            isPending={isPending}
          />
          {/* Media and Comments */}
          <View className="flex-row justify-between gap-4">
            <View className="flex-1 mb-6">
              <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Media {hasMedia ? `(${mediaCount})` : ""}
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/edit-task/task-media",
                    params: { id },
                  })
                }
                className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-14"
              >
                <ImageIcon size={20} color="#94A3B8" />
                <Text className="text-base text-gray-900 ml-3">Add Media</Text>
              </Pressable>
              {/* {imageUrl && (
              <TouchableOpacity
                onPress={handleChangeImage}
                className="flex-row items-center bg-gray-100 rounded-2xl  h-64 justify-center"
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    resizeMode: "cover",
                  }}
                />
              </TouchableOpacity>
            )}
            {!imageUrl && (
              <TouchableOpacity
                onPress={handleChangeImage}
                className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-14"
              >
                <ImagePlus size={20} color="#94A3B8" />
                <Text className="text-base text-gray-900 ml-3">Add Image</Text>
              </TouchableOpacity>
            )} */}
            </View>
            <View className="flex-1 mb-6">
              <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Comments {hasComments ? `(${commentsCount})` : ""}
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/edit-task/task-comments",
                    params: { id },
                  })
                }
                className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-14 justify-center"
              >
                <MessageCircle size={20} color="#94A3B8" />
                <Text className="text-base text-gray-900 ml-3">
                  Add Comments
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* iOS Date Picker Modal */}
        {Platform.OS === "ios" && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white rounded-t-3xl p-4 pb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-gray-900">
                    Select Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="p-2 bg-gray-100 rounded-full"
                  >
                    <X size={20} color="#374151" />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dueDate ? new Date(dueDate) : new Date()}
                  mode="date"
                  display="inline"
                  onChange={onIOSDateChange}
                  style={{ height: 320 }}
                  textColor="#000000"
                  themeVariant="light"
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="mt-4 w-full bg-slate-900 py-4 rounded-xl items-center"
                >
                  <Text className="text-white font-bold text-lg">Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Update Button */}
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isPending || isLoading}
            className={`w-full h-14 bg-slate-900 rounded-full flex-row items-center justify-center shadow-lg ${
              isPending || isLoading ? "opacity-80" : ""
            }`}
          >
            {isPending || isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save
                  size={24}
                  color="white"
                  strokeWidth={2.5}
                  className="mr-2"
                />
                <Text className="text-white font-bold text-lg">
                  Update Task
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
