import { ChevronLeft } from "lucide-react-native";
import { PressableOpacity } from "pressto";
import { Text, View } from "react-native";

type HeaderProps = {
  headerRight?: React.ReactNode;
  headerLeft?: React.ReactNode;
  title: string;
  onBackPress: () => void;
};
const Header = ({
  headerRight,
  headerLeft,
  title,
  onBackPress,
}: HeaderProps) => {
  return (
    <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        <PressableOpacity
          onPress={onBackPress}
          style={{
            marginRight: 16,
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: 100,
            padding: 8,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </PressableOpacity>
        {headerLeft && headerLeft}
        <Text className="text-xl font-semibold text-gray-900">{title}</Text>
      </View>
      {headerRight && headerRight}
    </View>
  );
};

export default Header;
