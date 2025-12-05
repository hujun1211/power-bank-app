import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ActionButton {
  label: string;
  backgroundColor: string;
  onPress: () => void;
}

interface DeviceActionButtonsProps {
  primaryButton: ActionButton;
  secondaryButton?: ActionButton;
  showSecondary?: boolean;
}

export default function DeviceActionButtons({
  primaryButton,
  secondaryButton,
  showSecondary = false,
}: DeviceActionButtonsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      <Pressable
        className={`rounded-lg p-4 items-center ${primaryButton.backgroundColor}`}
        android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
        onPress={primaryButton.onPress}
      >
        <Text className="text-white font-semibold text-base">
          {primaryButton.label}
        </Text>
      </Pressable>

      {showSecondary && secondaryButton && (
        <Pressable
          className={`rounded-lg p-4 items-center ${secondaryButton.backgroundColor}`}
          android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
          onPress={secondaryButton.onPress}
        >
          <Text className="text-white font-semibold text-base">
            {secondaryButton.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
