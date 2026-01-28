import { SyncStatusPanel } from "@/components/SyncStatusPanel";
import { useQuery } from "@/db/realm";
import { JsonBlobTask, SyncStatus } from "@/db/realm/schemas/Json/JsonTask";
import { Stack } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DbItems() {
  const tasks = useQuery<JsonBlobTask>(JsonBlobTask).sorted("_id");

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <Stack.Screen options={{ title: "Local DB Inspector" }} />

      <View className="flex-1">
        <View style={styles.header}>
          <Text style={styles.stats}>Total Records: {tasks.length}</Text>
          <Text style={styles.legend}>
            🔴 = Local (Negative ID) | 🟢 = Synced (Real ID)
          </Text>
        </View>
        <SyncStatusPanel />

        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <DbRow task={item} />}
        />
      </View>
    </SafeAreaView>
  );
}

// Helper Component to render a single row
const DbRow = ({ task }: { task: JsonBlobTask }) => {
  const statusColors: Record<SyncStatus, string> = {
    synced: "#dcfce7", // Green
    pending_creation: "#e0f2fe", // Blue
    pending_update: "#fef9c3", // Yellow
    pending_delete: "#fee2e2", // Red
    sync_error: "#7f1d1d", // Dark Red
  };
  const bgStyle = {
    backgroundColor: statusColors[task.sync_status as SyncStatus] || "#fff",
    borderColor: task.sync_status === "sync_error" ? "red" : "transparent",
  };

  const taskParsed = task.parsed;

  const isError = task.sync_status === "sync_error";

  const statusText =
    task.sync_status === "sync_error"
      ? "SYNC ERROR"
      : task.sync_status === "synced"
        ? "SYNCED"
        : task.sync_status === "pending_creation"
          ? "PENDING CREATION"
          : task.sync_status === "pending_update"
            ? "PENDING UPDATE"
            : task.sync_status === "pending_delete"
              ? "PENDING DELETE"
              : "LOCAL STATUS";

  return (
    <View style={[styles.card, bgStyle]}>
      <View style={styles.rowHeader}>
        <Text style={styles.idText}>ID: {task._id}</Text>
        <Text style={styles.statusBadge}>{statusText}</Text>
      </View>

      <Text style={styles.title}>Title: {taskParsed.title}</Text>
      <Text style={styles.subText}>Priority: {taskParsed.priority}</Text>

      {/* Show raw JSON-like data for debugging */}

      {isError ? (
        <Text style={styles.errorText}>{task.sync_error_details}</Text>
      ) : (
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>
            {JSON.stringify(
              {
                description: taskParsed.description,
                due_date: taskParsed.due_date,
                completed: taskParsed?.is_completed,
                created: taskParsed.created_at,
                images: taskParsed?.images?.length ?? 0,
              },
              null,
              4,
            )}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f5" },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e4e4e7",
  },
  stats: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  legend: { fontSize: 12, color: "#71717a" },
  listContent: { padding: 16, paddingBottom: 120 },

  // Card Styles
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  idText: { fontFamily: "Courier New", fontWeight: "bold", fontSize: 14 },
  statusBadge: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },

  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  subText: { fontSize: 14, color: "#52525b", marginBottom: 8 },

  codeBlock: {
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 8,
    borderRadius: 6,
  },
  errorText: { fontSize: 12, color: "red", marginBottom: 8 },
  codeText: {
    fontSize: 12,
    // fontFamily: "Courier New"
    // color: "#3f3f66",
  },
});
