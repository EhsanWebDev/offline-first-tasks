import { ChevronLeft } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

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
        <TouchableOpacity onPress={onBackPress} className="mr-4">
          <ChevronLeft size={28} color="#1E293B" />
        </TouchableOpacity>
        {headerLeft && headerLeft}
        <Text className="text-xl font-semibold text-gray-900">{title}</Text>
      </View>
      {headerRight && headerRight}
    </View>
  );
};

export default Header;
