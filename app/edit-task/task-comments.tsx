// import { Header } from "@react-navigation/elements";
import {
  useAddCommentOnTask,
  useDeleteCommentOnTask,
} from "@/api/tasks/comments/mutations";
import { useTaskCommentsByTaskId } from "@/api/tasks/comments/queries";
import Header from "@/components/AppHeaders/Header";
import Toast from "@/components/Toast";
import { formatDate } from "@/utils/dateHelpers";
import {
  RelativePathString,
  router,
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Send, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TaskComments = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useTaskCommentsByTaskId(Number(id));
  const { mutate: addCommentMutation, isPending: isAddingComment } =
    useAddCommentOnTask();
  const { mutate: deleteCommentMutation, isPending: isDeletingComment } =
    useDeleteCommentOnTask();

  const [comment, setComment] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  if (isCommentsLoading) {
    return (
      <SafeAreaView className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-400 text-lg">Loading comments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const handleAddComment = () => {
    if (comment.trim() === "") {
      showToast("Please enter a comment");
      return;
    }
    addCommentMutation(
      { taskId: Number(id), content: comment },
      {
        onSuccess: () => {
          setComment("");
          //   Show a toast message that the comment was added successfully
          showToast("Comment added successfully");
        },
        onError: (error) => {
          console.error(error);
          //   Show a toast message that the comment was not added
          showToast("Failed to add comment");
        },
      }
    );
  };
  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation(
      { taskId: Number(id), commentId },
      {
        onSuccess: () => {
          showToast("Comment deleted successfully");
        },
        onError: (error) => {
          console.error(error);
          showToast("Failed to delete comment");
        },
      }
    );
  };
  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1">
        <Header title="Task Comments" onBackPress={() => router.back()} />
        <ScrollView
          className="flex-1 px-6 pt-6"
          refreshControl={
            <RefreshControl
              refreshing={isCommentsLoading}
              onRefresh={refetchComments}
              tintColor="#4F46E5"
              colors={["#4F46E5"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {comments?.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-400 text-lg">No comments yet</Text>
            </View>
          ) : (
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Comments
              </Text>
              {comments?.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment.content}
                  createdAt={comment.created_at}
                  commentId={comment.id}
                  onDeleteComment={(commentId) =>
                    handleDeleteComment(commentId)
                  }
                  isDeletingComment={isDeletingComment}
                />
              ))}
            </View>
          )}
        </ScrollView>
        {/* Footer */}
        <View className="px-6 pb-6 flex-row items-center justify-between gap-4">
          {/* Submit when the user presses the send key */}
          <TextInput
            placeholder="Add a comment"
            className="border border-gray-300 rounded-2xl py-3 px-4 flex-1 text-base  placeholder:text-gray-400"
            value={comment}
            onChangeText={setComment}
            onSubmitEditing={handleAddComment}
            textAlignVertical="top"
            submitBehavior="submit"
            multiline
          />
          <TouchableOpacity
            className="bg-gray-900 rounded-full h-12 w-12 flex-row items-center justify-center"
            onPress={handleAddComment}
          >
            {isAddingComment ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <Toast message={toastMessage} visible={toastVisible} />
      </SafeAreaView>
    </View>
  );
};

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const CommentItem = ({
  comment,
  createdAt,
  commentId,
  onDeleteComment,
  isDeletingComment,
}: {
  comment: string;
  createdAt: string;
  commentId: number;
  onDeleteComment: (commentId: number) => void;
}) => {
  const renderTextWithLinks = (text: string) => {
    const parts = text.split(URL_REGEX);
    return parts.map((part, index) => {
      if (URL_REGEX.test(part)) {
        return (
          <Text
            key={index}
            className="text-green-800 underline"
            onPress={() => router.push(part as unknown as RelativePathString)}
          >
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const deleteComment = (commentId: number) => {
    // console.log(commentId);
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDeleteComment(commentId);
          },
        },
      ]
    );
  };
  return (
    <View
      className={`flex-row items-start justify-between border border-gray-300 rounded-2xl p-4 mb-4 ${
        isDeletingComment ? "opacity-50" : ""
      }`}
    >
      <View className="flex-1">
        <Text className="text-base text-gray-900">
          {renderTextWithLinks(comment)}
        </Text>
        <Text className="text-xs text-gray-500">{formatDate(createdAt)}</Text>
      </View>
      <View className="w-6 h-6 bg-red-50 rounded-full flex-row items-center justify-center">
        <X size={12} color="red" onPress={() => deleteComment(commentId)} />
      </View>
    </View>
  );
};

export default TaskComments;
