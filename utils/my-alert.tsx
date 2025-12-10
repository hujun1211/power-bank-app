// components/CustomAlert.tsx
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type CustomAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  icon?: React.ReactNode;
  primaryColor?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
};

export default function CustomAlert({
  visible,
  title,
  message,
  icon,
  primaryColor = "#007AFF",
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  showCancel = true,
}: CustomAlertProps) {
  const colorScheme = useColorScheme();
  const defaultIcon = <AlertCircle size={20} color={colorScheme === "dark" ? "white" : "#666"} />;
  const displayIcon = icon || defaultIcon;
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        className={`flex-1 ${colorScheme === "dark" ? "bg-black/50" : "bg-black/50"} justify-center items-center px-6`}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* 上 - 标题区域 */}
          <View 
            className="px-6 py-3 border-b" 
            style={{ borderBottomColor: colorScheme === "dark" ? "#374151" : "#E5E7EB" }}
          >
            <View className="flex-row items-center">
              <View>{displayIcon}</View>
              <Text className="ml-2 text-xl font-bold text-black dark:text-white flex-1">
                {title}
              </Text>
            </View>
          </View>

          {/* 中 - 内容区域 */}
          <View className="p-6">
            <Text className="text-lg text-gray-600 dark:text-gray-400 leading-6">
              {message}
            </Text>
          </View>

          {/* 下 - 按钮区域 */}
          <View 
            className="flex-row border-t" 
            style={{ borderTopColor: colorScheme === "dark" ? "#374151" : "#E5E7EB" }}
          >
            {showCancel && (
              <Pressable
                onPress={onCancel}
                className="flex-1 py-3 items-center"
                style={{
                  borderRightWidth: 1,
                  borderRightColor:
                    colorScheme === "dark" ? "#374151" : "#E5E7EB",
                }}
              >
                <Text className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {cancelText}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              className="flex-1 py-3 items-center"
              style={{ backgroundColor: primaryColor + "10" }}
            >
              <Text
                className="text-lg font-semibold"
                style={{ color: primaryColor }}
              >
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
