// utils/showActionSheet.ts
import { useActionSheet } from "@expo/react-native-action-sheet";
import { ReactNode } from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ActionSheetOptions = {
  title?: string;
  message?: string;
  options: string[]; // 按钮文字数组
  cancelButtonIndex?: number; // 取消按钮索引
  destructiveButtonIndex?: number; // 红色按钮索引
  icon?: ReactNode; // 自定义图标（可选）
  brand?: "xiaomi" | "apple" | "huawei" | "samsung" | "default";
  onSelect?: (index: number) => void;
};

const brandTintColor = {
  xiaomi: "#FF6900",
  apple: "#999999",
  huawei: "#E70000",
  samsung: "#1428A0",
  default: Platform.OS === "ios" ? "#007AFF" : "#6200EE",
};

export const useCustomActionSheet = () => {
  const { showActionSheetWithOptions } = useActionSheet();
  const insets = useSafeAreaInsets();

  const show = ({
    title = "确认操作",
    message,
    options,
    cancelButtonIndex = options.length - 1,
    destructiveButtonIndex,
    icon,
    brand = "default",
    onSelect,
  }: ActionSheetOptions) => {
    const tintColor = brandTintColor[brand];

    // iOS 支持 tintColor，Android 自动适配
    const config = {
      options,
      cancelButtonIndex,
      destructiveButtonIndex,
      tintColor, // iOS 按钮高亮色
      title,
      message,
      userInterfaceStyle: "dark" as const,
      textStyle: {
        fontSize: 16,
        fontWeight: "500",
      },
      cancelButtonTextStyle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#999999",
      },
      destructiveButtonTextStyle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FF3B30",
      },
      containerStyle: {
        paddingLeft: insets.left + 10,
        paddingRight: insets.right + 10,
        paddingBottom: insets.bottom + 10,
      },
      // iOS 13+ 支持图标（通过 title 拼接）
      ...(Platform.OS === "ios" &&
        icon && {
          title: (
            <View className="items-center py-2">
              {icon}
              <Text className="text-2xl font-bold text-black dark:text-white mt-3">
                {title}
              </Text>
            </View>
          ),
        }),

      ...(Platform.OS === "android" && {
        title: (
          <View className="items-center py-2">
            {icon}
            <Text className="text-2xl font-bold text-black dark:text-white">
              {title}
            </Text>
          </View>
        ),
        message: message ? (
          <Text className="text-base text-gray-600 dark:text-gray-300 mt-2">
            {message}
          </Text>
        ) : undefined,
      }),
    };

    showActionSheetWithOptions(
      config as ActionSheetOptions,
      (selectedIndex) => {
        if (
          selectedIndex === undefined ||
          selectedIndex === cancelButtonIndex
        ) {
          return; // 取消
        }
        onSelect?.(selectedIndex);
      }
    );
  };

  return { show };
};
