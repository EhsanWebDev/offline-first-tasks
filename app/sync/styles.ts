import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  pendingCreationBadge: {
    backgroundColor: "#DBEAFE",
  },
  pendingCreationText: {
    color: "#1D4ED8",
  },
  pendingUpdateBadge: {
    backgroundColor: "#FEF3C7",
  },
  pendingUpdateText: {
    color: "#B45309",
  },
  syncErrorBadge: {
    backgroundColor: "#FEE2E2",
  },
  syncErrorText: {
    color: "#DC2626",
  },
  syncedBadge: {
    backgroundColor: "#D1FAE5",
  },
  syncedText: {
    color: "#059669",
  },
  operationLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  errorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: "#991B1B",
    flex: 1,
  },
  retryButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#1F2937",
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  pushButton: {
    backgroundColor: "#1F2937",
    borderRadius: 28,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pushButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  pushButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
});
