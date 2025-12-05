// components/CustomAlert.tsx
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
  icon = <AlertCircle size={24} color="#666" />,
  primaryColor = "#007AFF",
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  showCancel = true,
}: CustomAlertProps) {
  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        className="flex-1 bg-black/50 justify-center items-center px-6"
      >
        <View className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
          {/* 上 - 标题区域 */}
          <View className="px-6 py-3 border-b border-gray-200 dark:border-gray-800">
            <View className="flex-row items-center">
              <View>{icon}</View>
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
          <View className="flex-row border-t border-gray-200 dark:border-gray-800">
            {showCancel && (
              <Pressable
                onPress={onCancel}
                className="flex-1 py-3 items-center border-r border-gray-200 dark:border-gray-800"
              >
                <Text className="text-lg font-medium text-gray-600 dark:text-gray-400">
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
        </View>
      </Animated.View>
    </Modal>
  );
}
