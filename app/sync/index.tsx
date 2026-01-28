import { useQuery, useRealm } from "@/db/realm";
import { JsonBlobTask } from "@/db/realm/schemas/Json/JsonTask";
import { SyncManager } from "@/services/SyncManager";
import { pushSingleTaskById } from "@/utils/syncQueue";
import { Stack, useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Upload,
} from "lucide-react-native";
import { FC, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./styles";

// Status badge component
const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "pending_creation":
        return [styles.statusBadge, styles.pendingCreationBadge];
      case "pending_update":
        return [styles.statusBadge, styles.pendingUpdateBadge];
      case "sync_error":
        return [styles.statusBadge, styles.syncErrorBadge];
      case "synced":
        return [styles.statusBadge, styles.syncedBadge];
      default:
        return [styles.statusBadge];
    }
  };

  const getTextStyle = () => {
    switch (status) {
      case "pending_creation":
        return [styles.statusText, styles.pendingCreationText];
      case "pending_update":
        return [styles.statusText, styles.pendingUpdateText];
      case "sync_error":
        return [styles.statusText, styles.syncErrorText];
      case "synced":
        return [styles.statusText, styles.syncedText];
      default:
        return [styles.statusText];
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "pending_creation":
        return "Pending Create";
      case "pending_update":
        return "Pending Update";
      case "sync_error":
        return "Sync Error";
      case "synced":
        return "Synced";
      default:
        return status;
    }
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{getStatusLabel()}</Text>
    </View>
  );
};

// Task card component
const SyncTaskCard: FC<{
  task: JsonBlobTask;
  onRetry: (taskId: string) => void;
  isRetrying: boolean;
}> = ({ task, onRetry, isRetrying }) => {
  const getOperationLabel = () => {
    switch (task.sync_status) {
      case "pending_creation":
        return "Will be created on server";
      case "pending_update":
        return "Will be updated on server";
      case "sync_error":
        return "Failed to sync - tap retry";
      default:
        return "";
    }
  };

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.parsed.title}
        </Text>
        <StatusBadge status={task.sync_status} />
      </View>

      <Text style={styles.operationLabel}>{getOperationLabel()}</Text>

      {task.sync_status === "sync_error" && task.sync_error_details && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#DC2626" style={styles.errorIcon} />
          <Text style={styles.errorText}>{task.sync_error_details}</Text>
        </View>
      )}

      {task.sync_status === "sync_error" && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => onRetry(task._id.toString())}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.retryButtonText}>Retry</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// Summary component
const SyncSummary: FC<{
  pendingCreation: number;
  pendingUpdate: number;
  syncError: number;
}> = ({ pendingCreation, pendingUpdate, syncError }) => {
  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryCount, { color: "#1D4ED8" }]}>
          {pendingCreation}
        </Text>
        <Text style={styles.summaryLabel}>To Create</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryCount, { color: "#B45309" }]}>
          {pendingUpdate}
        </Text>
        <Text style={styles.summaryLabel}>To Update</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryCount, { color: "#DC2626" }]}>
          {syncError}
        </Text>
        <Text style={styles.summaryLabel}>Errors</Text>
      </View>
    </View>
  );
};

// Empty state component
const EmptyState: FC = () => {
  return (
    <View style={styles.emptyContainer}>
      <CheckCircle2 size={64} color="#10B981" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>All Synced!</Text>
      <Text style={styles.emptySubtitle}>
        All your tasks are up to date with the server. Any new changes will
        appear here.
      </Text>
    </View>
  );
};

// Main screen component
const SyncScreen: FC = () => {
  const router = useRouter();
  const realm = useRealm();
  const [isPushing, setIsPushing] = useState(false);
  const [retryingTaskId, setRetryingTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Get pending tasks from Realm (live query)
  const tasksQuery = useQuery<JsonBlobTask>(JsonBlobTask).filtered(
    "sync_status != 'synced'",
  );

  const tasks = useMemo(() => Array.from(tasksQuery), [tasksQuery]);

  // Calculate counts from the tasks array
  const counts = useMemo(
    () => ({
      pendingCreation: tasks.filter((t) => t.sync_status === "pending_creation")
        .length,
      pendingUpdate: tasks.filter((t) => t.sync_status === "pending_update")
        .length,
      syncError: tasks.filter((t) => t.sync_status === "sync_error").length,
      total: tasks.length,
    }),
    [tasks],
  );

  const handlePushChanges = useCallback(async () => {
    if (isPushing || counts.total === 0) return;

    setIsPushing(true);
    setProgress({ current: 0, total: counts.total });

    try {
      const result = await SyncManager.processSyncQueue(
        realm,
        (current, total) => {
          setProgress({ current, total });
        },
      );

      setProgress(null);

      if (result.failures.length === 0) {
        Alert.alert(
          "Sync Complete",
          `Successfully synced ${result.success} task${result.success !== 1 ? "s" : ""}.`,
        );
      } else {
        Alert.alert(
          "Sync Partially Complete",
          `Synced ${result.success} task${result.success !== 1 ? "s" : ""}, but ${result.failures.length} failed. Check the error messages and retry.`,
        );
      }
    } catch (error) {
      setProgress(null);
      Alert.alert(
        "Sync Failed",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsPushing(false);
    }
  }, [isPushing, counts.total, realm]);

  const handleRetry = useCallback(async (taskId: string) => {
    setRetryingTaskId(taskId);

    try {
      const result = await pushSingleTaskById(realm, taskId);

      if (result.success) {
        Alert.alert("Success", "Task synced successfully!");
      } else {
        Alert.alert("Retry Failed", result.error || "Unknown error occurred");
      }
    } catch (error) {
      Alert.alert(
        "Retry Failed",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setRetryingTaskId(null);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: JsonBlobTask }) => (
      <SyncTaskCard
        task={item}
        onRetry={handleRetry}
        isRetrying={retryingTaskId === item._id.toString()}
      />
    ),
    [handleRetry, retryingTaskId],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Queue</Text>
        </View>

        {/* Summary */}
        {counts.total > 0 && (
          <SyncSummary
            pendingCreation={counts.pendingCreation}
            pendingUpdate={counts.pendingUpdate}
            syncError={counts.syncError}
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {counts.total === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item._id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Footer with Push Button */}
        {counts.total > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.pushButton,
                isPushing && styles.pushButtonDisabled,
              ]}
              onPress={handlePushChanges}
              disabled={isPushing}
            >
              {isPushing ? (
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.progressText}>
                    {progress
                      ? `Syncing ${progress.current}/${progress.total}...`
                      : "Preparing..."}
                  </Text>
                </View>
              ) : (
                <>
                  <Upload size={24} color="#FFFFFF" />
                  <Text style={styles.pushButtonText}>
                    Push {counts.total} Change{counts.total !== 1 ? "s" : ""}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

export default SyncScreen;
