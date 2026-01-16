import { PressableScale } from "pressto";
import { ScrollView, Text, View } from "react-native";

export type FilterStatus = "All Tasks" | "Ongoing" | "Completed";

interface StatusFilterProps {
  currentFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  counts: {
    all: number;
    ongoing: number;
    completed: number;
  };
}

export default function StatusFilter({
  currentFilter,
  onFilterChange,
  counts,
}: StatusFilterProps) {
  const filters: { label: FilterStatus; count: number }[] = [
    { label: "All Tasks", count: counts.all },
    { label: "Ongoing", count: counts.ongoing },
    { label: "Completed", count: counts.completed },
  ];

  return (
    <View className="mb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      >
        {filters.map((filter) => {
          const isActive = currentFilter === filter.label;
          return (
            <PressableScale
              key={filter.label}
              onPress={() => onFilterChange(filter.label)}
              // className={`flex-row items-center px-5 py-3 rounded-full mr-3 ${
              //   isActive ? "bg-gray-900" : "bg-white border border-gray-100"
              // }`}
              style={{
                shadowColor: isActive ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: isActive ? 4 : 0,
                // Android specific fix: ensure background color is solid for elevation
                backgroundColor: isActive ? "#111827" : "#FFFFFF",
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                className={`text-base font-semibold mr-2 ${
                  isActive ? "text-white" : "text-gray-600"
                }`}
              >
                {filter.label}
              </Text>
              <View
                className={`px-2 py-0.5 rounded-full ${
                  isActive ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? "text-white" : "text-gray-600"
                  }`}
                >
                  {filter.count}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}
