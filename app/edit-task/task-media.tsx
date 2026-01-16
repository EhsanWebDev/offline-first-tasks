import {
  useCreateTaskMedia,
  useDeleteTaskMedia,
} from "@/api/tasks/media/mutations";
import { useTaskMediaByTaskId } from "@/api/tasks/media/queries";
import Header from "@/components/AppHeaders/Header";
import {
  deleteImageFromSupabase,
  uploadImageToSupabase,
} from "@/utils/imageUpload";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ImagePlus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TaskMedia = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();

  const { data: media, isLoading: isTaskMediaLoading } = useTaskMediaByTaskId(
    Number(id)
  );

  const [uploading, setUploading] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);

  const {
    mutate: createTaskMediaMutation,
    isPending: isCreateTaskMediaPending,
  } = useCreateTaskMedia();
  const {
    mutate: deleteTaskMediaMutation,
    isPending: isDeleteTaskMediaPending,
  } = useDeleteTaskMedia();

  const pickImage = async () => {
    if (isCreateTaskMediaPending || isDeleteTaskMediaPending) return;
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "We need access to your photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        await handleUploads(result.assets);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploads = async (
    assets: ImagePicker.ImagePickerAsset[] | undefined
  ) => {
    if (!assets || assets.length === 0) return;
    setUploading(true);
    try {
      for (const asset of assets) {
        // A. Upload to Bucket (using your existing helper)
        const publicUrl = await uploadImageToSupabase(asset.uri);

        // B. Save to new Table
        createTaskMediaMutation(
          { taskId: Number(id), url: publicUrl, type: "image" },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["task-media", Number(id)],
              });
              setUploading(false);
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

  const handleDeleteMediaFromStorage = async (url: string) => {
    await deleteImageFromSupabase(url);
    return true;
  };
  const handleDeleteMedia = (mediaId: number, image: string) => {
    Alert.alert("Delete Media", "Are you sure you want to delete this media?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingMediaId(mediaId);
          deleteTaskMediaMutation(
            { taskId: Number(id), mediaId },
            {
              onSuccess: async () => {
                await handleDeleteMediaFromStorage(image);
                queryClient.invalidateQueries({
                  queryKey: ["task-media", Number(id)],
                });
                Alert.alert("Media deleted successfully");
                setDeletingMediaId(null);
              },
              onError: (error) => {
                console.error(error);
                Alert.alert("Error", (error as Error).message);
                setDeletingMediaId(null);
              },
            }
          );
        },
      },
    ]);
  };

  const PADDING_X = 32;
  const GAP = 12;
  const NUM_COLS = 3;

  const itemWidth = (width - PADDING_X - GAP * (NUM_COLS - 1)) / NUM_COLS;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      <Header title="Task Media" onBackPress={() => router.back()} />
      {isTaskMediaLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="gray" />
        </View>
      ) : media?.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-lg">No media yet</Text>
        </View>
      ) : (
        <View className="flex-1 pt-6 flex-row flex-wrap gap-3 px-4">
          {(media ?? []).map((item) => (
            <View key={item.id} style={{ width: itemWidth }}>
              <MediaItem
                image={item.url}
                onDelete={(image) => handleDeleteMedia(item.id, image)}
                isDeleting={deletingMediaId === item.id}
              />
            </View>
          ))}
        </View>
      )}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={pickImage}
          disabled={
            isCreateTaskMediaPending ||
            isDeleteTaskMediaPending ||
            uploading ||
            deletingMediaId !== null
          }
          className="flex-row items-center justify-center bg-blue-500 rounded-full p-2"
        >
          <ImagePlus
            size={20}
            color={uploading || deletingMediaId !== null ? "gray" : "white"}
          />
          <Text
            className={`text-${
              uploading || deletingMediaId !== null ? "gray" : "white"
            } text-sm font-bold ml-2`}
          >
            {uploading ? "Uploading..." : "Photo Library"}
          </Text>
          {uploading && <ActivityIndicator size="small" color="white" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const MediaItem = ({
  image,
  onDelete,
  isDeleting,
}: {
  image: string;
  onDelete: (image: string) => void;
  isDeleting: boolean;
}) => {
  return (
    <View className="flex-row items-center justify-between relative">
      <Image
        source={{ uri: image }}
        style={{ width: 100, height: 100, borderRadius: 10 }}
        contentFit="cover"
      />
      <TouchableOpacity
        onPress={() => onDelete(image)}
        className="absolute top-0 right-0 bg-white rounded-full p-2"
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="gray" />
        ) : (
          <Trash2 size={16} color="#EF4444" />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TaskMedia;
