import DeviceActionButtons from "@/components/ui/device-action-buttons";
import TopTitle from "@/components/ui/top-title";
import { Stack } from "expo-router";
import { CheckCircle, Download } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert from "../../utils/my-alert";

export default function OTAPage() {
  const insets = useSafeAreaInsets();
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    primaryColor?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    title: "",
    message: "",
    confirmText: "确认",
    showCancel: false,
  });

  const handleStartUpdate = async () => {
    setAlertConfig({
      title: "开始升级",
      message: "确认要升级固件吗？升级过程中请勿中断电源",
      confirmText: "确定",
      cancelText: "取消",
      showCancel: true,
      onConfirm: async () => {
        setAlertVisible(false);
        setIsUpdating(true);
        // 模拟升级进度
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setProgress(i);
        }
        setIsUpdating(false);
        setAlertConfig({
          title: "成功",
          message: "固件升级完成",
          primaryColor: "#10B981",
          confirmText: "确定",
          showCancel: false,
          onConfirm: () => setAlertVisible(false),
        });
        setAlertVisible(true);
      },
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle title="固件升级" showBack={true} />
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="p-4">
            {/* 当前版本信息 */}
            <View className="bg-blue-50 p-4 rounded-lg mb-6">
              <View className="flex-row items-center gap-3 mb-4">
                <CheckCircle size={24} color="#3B82F6" strokeWidth={2} />
                <Text className="text-lg font-semibold text-black">
                  当前版本
                </Text>
              </View>
              <Text className="text-4xl font-bold text-blue-600 mb-2">
                v2.5.1
              </Text>
              {/* <Text className="text-sm text-gray-600">
                最后检查时间：2024年12月5日
              </Text> */}
            </View>

            {/* 最新版本信息 */}
            <View className="bg-green-50 p-4 rounded-lg mb-6">
              <View className="flex-row items-center gap-3 mb-4">
                <Download size={24} color="#10B981" strokeWidth={2} />
                <Text className="text-lg font-semibold text-black">
                  最新版本
                </Text>
              </View>
              <Text className="text-4xl font-bold text-green-600 mb-2">
                v2.6.0
              </Text>
              <Text className="text-sm text-gray-600 mb-4">大小：125 MB</Text>
              <View className="bg-white p-3 rounded-lg">
                <Text className="text-xs text-gray-700 font-semibold mb-2">
                  更新内容：
                </Text>
                <Text className="text-xs text-gray-600 leading-5">
                  • 优化电量显示精度{"\n"}• 改进充电效率{"\n"}• 修复已知 BUG
                  {"\n"}• 增强稳定性
                </Text>
              </View>
            </View>

            {/* 升级说明 */}
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="text-sm font-semibold text-black mb-3">
                升级说明
              </Text>
              <Text className="text-xs text-gray-600 leading-1">
                1. 升级过程需要5-10分钟，请耐心等待。{"\n"}
                {"\n"}
                2. 升级期间设备会自动重启，请勿中断。{"\n"}
                {"\n"}
                3. 升级失败会自动恢复到之前版本。{"\n"}
                {"\n"}
                4. 升级完成后会自动重启。
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Button with Progress */}
        {isUpdating ? (
          <View
            style={{ paddingBottom: insets.bottom + 12 }}
            className="gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black"
          >
            {/* Button with Progress Background */}
            <View
              className="rounded-lg overflow-hidden"
              style={{ position: "relative" }}
            >
              {/* Background base */}
              <View
                className="absolute top-0 left-0 w-full h-full bg-orange-300 dark:bg-orange-700"
                style={{ zIndex: 0 }}
              />
              {/* Progress Background - filled portion */}
              <View
                className="absolute top-0 left-0 h-full bg-orange-500 dark:bg-orange-600"
                style={{ width: `${progress}%`, zIndex: 1 }}
              />
              {/* Button Content - on top */}
              <View
                className="rounded-lg p-4 items-center justify-center"
                style={{
                  zIndex: 2,
                }}
              >
                <Text className="text-white font-semibold text-base">
                  升级中 {Math.round(progress)}%
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <DeviceActionButtons
            primaryButton={{
              label: "立即升级",
              backgroundColor: "bg-blue-500 dark:bg-blue-600",
              onPress: handleStartUpdate,
            }}
            showSecondary={false}
          />
        )}
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryColor={alertConfig.primaryColor || "#007AFF"}
        confirmText={alertConfig.confirmText || "确认"}
        cancelText={alertConfig.cancelText || "取消"}
        showCancel={alertConfig.showCancel !== false}
        onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
        onCancel={() => setAlertVisible(false)}
      />
    </>
  );
}
