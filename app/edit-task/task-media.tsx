import {
  useCreateTaskMedia,
  useDeleteTaskMedia,
} from "@/api/tasks/media/mutations";
import { useTaskMediaByTaskId } from "@/api/tasks/media/queries";
import Header from "@/components/AppHeaders/Header";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ImagePlus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TaskMedia = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: media } = useTaskMediaByTaskId(Number(id));
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<
    { id: string; url: string }[]
  >([]);
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
        setSelectedImages(
          result.assets.map((asset) => ({
            id: asset.uri as string,
            url: asset.uri as string,
          }))
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateTaskMedia = (url: string) => {
    if (!url) return;
    setUploading(true);
    createTaskMediaMutation(
      { taskId: Number(id), url, type: "image" },
      {
        onSuccess: () => {
          setImageUrl(null);
        },
        onError: (error) => {
          console.error(error);
          Alert.alert("Error", (error as Error).message);
        },
      }
    );
    setImageUrl(null);
    setUploading(false);
  };

  const handleDeleteTaskMedia = (mediaId: number) => {
    deleteTaskMediaMutation({ taskId: Number(id), mediaId });
  };

  console.log(selectedImages);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      <Header title="Task Media" onBackPress={() => router.back()} />
      {/* {media?.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-lg">No media yet</Text>
        </View>
      ) : ( */}
      <View className="flex-1 pt-6 justify-between flex-row flex-wrap gap-y-4 gap-x-2 px-4">
        {/* {(media ?? []).map((item) => (
            <MediaItem key={item.id} image={item.url} />
          ))} */}
        {selectedImages.map((image) => (
          <MediaItem key={image.id} image={image.url} />
        ))}
      </View>
      {/* )} */}

      {/* Footer */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={pickImage}
          className="flex-row items-center justify-center bg-blue-500 rounded-full p-2"
        >
          <ImagePlus size={20} color="white" />
          <Text className="text-white text-sm font-bold ml-2">
            Photo Library
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const MediaItem = ({ image }: { image: string }) => {
  return (
    <View className="flex-row items-center justify-between relative">
      <Image
        source={{ uri: image }}
        style={{ width: 100, height: 100, borderRadius: 10 }}
        contentFit="cover"
      />
      <TouchableOpacity className="absolute top-0 right-0 bg-white rounded-full p-2">
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

export default TaskMedia;
