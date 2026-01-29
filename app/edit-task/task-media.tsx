import Header from "@/components/AppHeaders/Header";
import {
  addTaskMediaToTask,
  deleteTaskMediaFromTask,
} from "@/db/queries/taskApi";
import { useQuery, useRealm } from "@/db/realm";
import { JsonBlobTask } from "@/db/realm/schemas/Json/JsonTask";
import {
  deleteImageFromSupabase,
  uploadImageToSupabase,
} from "@/utils/imageUpload";

import dayjs from "dayjs";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ImagePlus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TaskMedia = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { width } = useWindowDimensions();

  const realm = useRealm();
  const theTaskQuery = useQuery<JsonBlobTask>(JsonBlobTask).filtered(
    "_id == $0",
    Number(id),
  );
  const theTask = theTaskQuery.length > 0 ? theTaskQuery[0] : null;
  const allMedia = theTask?.parsed.media ?? [];
  const mediaCount = allMedia.length;
  const hasMedia = mediaCount > 0;

  const [uploading, setUploading] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const pickImage = async () => {
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
    assets: ImagePicker.ImagePickerAsset[] | undefined,
  ) => {
    if (!assets || assets.length === 0) return;
    setUploading(true);
    try {
      for (const asset of assets) {
        // A. Upload to Bucket (using your existing helper)
        const publicUrl = await uploadImageToSupabase(asset.uri);

        if (theTask) {
          addTaskMediaToTask(realm, theTask, {
            _id: Date.now(),
            url: publicUrl,
            type: "image",
            created_at: dayjs().format(),
            task_id: Number(theTask?._id ?? 0),
          });
        }
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

          if (theTask) {
            deleteTaskMediaFromTask(realm, theTask, mediaId);
            await handleDeleteMediaFromStorage(image);
            Alert.alert("Media deleted successfully");
            setDeletingMediaId(null);
          }
        },
      },
    ]);
  };

  const handleImagePress = (image: string) => {
    setShowFullImage(true);
    setFullImageUrl(image);
  };

  const PADDING_X = 32;
  const GAP = 12;
  const NUM_COLS = 3;

  const itemWidth = (width - PADDING_X - GAP * (NUM_COLS - 1)) / NUM_COLS;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      <Header title="Task Media" onBackPress={() => router.back()} />
      {!hasMedia ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-lg">No media yet</Text>
        </View>
      ) : (
        <View className="flex-1 pt-6 flex-row flex-wrap gap-3 px-4">
          {allMedia.map((item) => (
            <View key={item._id} style={{ width: itemWidth }}>
              <MediaItem
                image={item.url}
                onDelete={(image) => handleDeleteMedia(item._id, image)}
                isDeleting={deletingMediaId === item._id}
                onImagePress={() => handleImagePress(item.url)}
              />
            </View>
          ))}
        </View>
      )}
      <Modal
        visible={showFullImage}
        onRequestClose={() => setShowFullImage(false)}
        transparent={true}
        animationType="fade"
      >
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            setShowFullImage(false);
          }}
          className="flex-1 justify-end bg-black/50 relative p-4"
        >
          <View className="flex-1 justify-end relative p-4">
            <Image
              source={{ uri: fullImageUrl ?? "" }}
              style={{ width: "100%", height: "100%", flex: 1 }}
              contentFit="contain"
            />
          </View>
        </Pressable>
      </Modal>
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={pickImage}
          disabled={uploading || deletingMediaId !== null}
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

type MediaItemProps = {
  image: string;
  onDelete?: (image: string) => void;
  onImagePress?: () => void;
  isDeleting: boolean;
};
const MediaItem = ({
  image,
  onDelete = () => {},
  onImagePress = () => {},
  isDeleting,
}: MediaItemProps) => {
  return (
    <TouchableOpacity
      onPress={(e) => {
        e.stopPropagation();
        onImagePress();
      }}
    >
      <View className="flex-row items-center justify-between relative">
        <Image
          source={{ uri: image }}
          style={{ width: 100, height: 100, borderRadius: 10 }}
          contentFit="cover"
        />
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onDelete(image);
          }}
          className="absolute top-0 right-0 bg-white rounded-full p-2"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="gray" />
          ) : (
            <Trash2 size={16} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default TaskMedia;
