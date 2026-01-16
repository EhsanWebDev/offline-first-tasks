import { useCreateTask } from "@/api/tasks/mutations";
import AppInput from "@/components/TextInput/AppInput";
import { uploadImageToSupabase } from "@/utils/imageUpload";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Calendar, ChevronLeft, ImagePlus, Plus, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Priority } from "../components/PriorityTag";
import { PRIORITY_COLORS } from "../constants/colors";
import { formatDate } from "../utils/dateHelpers";

export default function CreateTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  const { mutate: createTaskMutation, isPending } = useCreateTask();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    setErrors({});

    try {
      if (imageUri) {
        setUploading(true);
        const imageUrlFromSupabase = await uploadImageToSupabase(imageUri);

        createTaskMutation(
          {
            title: title.trim(),
            description: description.trim(),
            priority: priority as "low" | "medium" | "high",
            due_date: dueDate ? dueDate.toISOString() : undefined,
            image_url: imageUrlFromSupabase,
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
      } else {
        createTaskMutation(
          {
            title: title.trim(),
            description: description.trim(),
            priority: priority as "low" | "medium" | "high",
            due_date: dueDate ? dueDate.toISOString() : undefined,
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
    } catch (error) {
      console.error(error);
      Alert.alert("Error", (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">
            Create Task
          </Text>
        </View>

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
            </TouchableOpacity>

            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) onDateChange(date);
                }}
              />
            )}
          </View>
          {/* Priority */}
          <View className="mb-8">
            <Text className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Priority Level
            </Text>
            <View className="flex-row justify-between">
              {(["low", "medium", "high"] as Priority[]).map((p) => {
                const colors = PRIORITY_COLORS[p];
                const isSelected = priority === p;

                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.7}
                    className="flex-1 mx-1 h-14 rounded-2xl items-center justify-center border-2"
                    style={{
                      backgroundColor: isSelected ? colors.lightBg : "#F9FAFB",
                      borderColor: isSelected ? colors.solid : "transparent",
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {/* Image */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Image (Optional)
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-14"
            >
              <ImagePlus size={20} color="#94A3B8" />
              <Text className="text-base text-gray-900 ml-3">
                {imageUri ? "Change Image" : "Add Image"}
              </Text>
            </TouchableOpacity>
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
                  value={dueDate || new Date()}
                  mode="date"
                  display="inline"
                  onChange={(event, date) => {
                    if (date) setDueDate(date);
                  }}
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

        {/* Create Button */}
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isPending || uploading}
            className={`w-full h-14 bg-slate-900 rounded-full flex-row items-center justify-center shadow-lg ${
              isPending || uploading ? "opacity-80" : ""
            }`}
          >
            {isPending || uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Plus
                  size={24}
                  color="white"
                  strokeWidth={2.5}
                  className="mr-2"
                />
                <Text className="text-white font-bold text-lg">
                  {uploading ? "Uploading..." : "Create Task"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
