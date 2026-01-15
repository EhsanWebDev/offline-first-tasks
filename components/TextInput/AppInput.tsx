import { Text, TextInput, TextInputProps, View } from "react-native";

interface AppInputProps extends TextInputProps {
  label: string;
  rightIcon?: React.ReactNode;
  error?: string;
}
const AppInput = (props: AppInputProps) => {
  return (
    <View className={`${props.error ? "border border-red-500" : ""}`}>
      <Text className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
        {props.label}
      </Text>
      <View
        className={` bg-gray-100 rounded-2xl px-4 ${
          props.multiline ? "h-28 py-3.5 " : "h-14"
        }`}
      >
        <TextInput
          className="flex-1  text-base text-gray-900 pt-0 tracking-wide"
          style={[{ lineHeight: 16 }]}
          placeholderTextColor="#94A3B8"
          {...props}
        />
        {props.rightIcon && props.rightIcon}
      </View>
      {props.error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">{props.error}</Text>
      )}
    </View>
  );
};

export default AppInput;
