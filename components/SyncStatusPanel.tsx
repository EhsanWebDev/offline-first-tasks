import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useRealm } from "@/db/realm";
import { SyncManager, SyncResult } from "@/services/SyncManager";

export const SyncStatusPanel = () => {
  const realm = useRealm();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    // 1. Reset UI State
    setIsSyncing(true);
    setSyncResult(null);
    setProgress(0);

    try {
      // 2. Call the NEW Sync Manager method
      // We pass the callback to update the progress bar
      const result = await SyncManager.processSyncQueue(
        realm,
        (current, total) => {
          // Prevent division by zero if total is 0
          const percentage = total > 0 ? current / total : 0;
          setProgress(percentage);
        },
      );

      // 3. Store the result (Success counts vs Failures)
      setSyncResult(result);
    } catch (error) {
      console.error("Critical Sync Error:", error);
    } finally {
      // 4. Turn off loading state regardless of outcome
      setIsSyncing(false);
    }
  };

  // --- RENDER STATES ---

  // 1. Loading / Syncing State
  if (isSyncing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.statusText}>Syncing with Cloud...</Text>
          <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>
    );
  }

  // 2. Finished State (With Errors)
  if (syncResult && syncResult.failures.length > 0) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>⚠️ Sync Incomplete</Text>
        <Text style={styles.summaryText}>
          {syncResult.success} synced, {syncResult.failures.length} failed.
        </Text>

        {/* List the failures */}
        {syncResult.failures.map((fail) => (
          <Text key={fail.id} style={styles.failureItem}>
            • Item {fail.id}: {fail.reason}
          </Text>
        ))}

        <TouchableOpacity style={styles.retryButton} onPress={handleSync}>
          <Text style={styles.retryText}>Retry Failed Items</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Finished State (Success) or Idle
  return (
    <View style={styles.container}>
      {syncResult && syncResult.success > 0 && (
        <Text style={styles.successText}>
          ✅ Last sync successful ({syncResult.success} items)
        </Text>
      )}
      <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
        <Text style={styles.syncButtonText}>
          {syncResult ? "Sync Again" : "Sync Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    margin: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusText: { fontSize: 14, color: "#555", fontWeight: "600" },
  percentage: { fontSize: 14, color: "#007AFF", fontWeight: "bold" },

  // Custom Progress Bar
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#007AFF" },

  // Button Styles
  syncButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  syncButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // Error Styles
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
  },
  errorTitle: {
    color: "#B91C1C",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  summaryText: { color: "#7F1D1D", marginBottom: 8 },
  failureItem: { color: "#B91C1C", fontSize: 12, marginLeft: 8 },
  retryButton: {
    marginTop: 12,
    backgroundColor: "#B91C1C",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  retryText: { color: "white", fontWeight: "600" },
  successText: {
    color: "green",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
  },
});
