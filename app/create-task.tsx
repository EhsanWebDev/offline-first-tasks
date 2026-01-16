import { useCreateTask } from "@/api/tasks/mutations";
import PriorityBar from "@/components/PriorityBar";
import AppInput from "@/components/TextInput/AppInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Calendar, ChevronLeft, Plus, X } from "lucide-react-native";
import { PressableScale } from "pressto";
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
import { formatDate } from "../utils/dateHelpers";

export default function CreateTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  const { mutate: createTaskMutation, isPending } = useCreateTask();

  const handleCreate = async () => {
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    setErrors({});

    try {
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
    } catch (error) {
      console.error(error);
      Alert.alert("Error", (error as Error).message);
    } finally {
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
          <PriorityBar
            priority={priority}
            setPriority={setPriority}
            isPending={isPending}
          />
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
          <PressableScale
            onPress={handleCreate}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 28,
              backgroundColor: isPending ? "#6B7280" : "#1E293B",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "row",
            }}
            enabled={!isPending}
            // className={`w-full h-14 bg-slate-900 rounded-full flex-row items-center justify-center shadow-lg ${
            //   isPending || uploading ? "opacity-80" : ""
            // }`}
          >
            {isPending ? (
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
                  {"Create Task"}
                </Text>
              </>
            )}
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}
