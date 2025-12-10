import DeviceActionButtons from "@/components/ui/device-action-buttons";
import TopTitle from "@/components/ui/top-title";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import { Stack, useRouter } from "expo-router";
import {
  Bluetooth,
  Check,
  Signal,
  SignalHigh,
  SignalLow,
  Tv,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert from "../../utils/my-alert";

interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  appearance?: number;
  serviceUUIDs?: string[];
  manufacturerData?: string;
  deviceType?: string;
}

let bleManager: BleManager | null = null;

// 全局缓存，避免信号变化导致图标变化
const deviceTypeCache = new Map<string, React.FC<any>>();
const deviceTypeConfidence = new Map<string, "high" | "medium" | "low">();

// 清理设备类型缓存
const clearDeviceTypeCache = () => {
  deviceTypeCache.clear();
  deviceTypeConfidence.clear();
};

const getBleManager = async () => {
  try {
    if (!bleManager) {
      bleManager = new BleManager();
    }

    // 请求权限（Android 31+）
    if (
      Platform.OS === "android" &&
      Platform.Version &&
      Platform.Version >= 31
    ) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const denied = Object.values(result).some(
        (permission) => permission !== PermissionsAndroid.RESULTS.GRANTED
      );

      if (denied) {
        console.warn("Some permissions denied");
      }
    }

    return bleManager;
  } catch (err) {
    console.error("BleManager error:", err);
    throw err;
  }
};

// 根据信号强度返回颜色和等级
const getRssiInfo = (
  rssi: number
): { color: string; level: number; icon: React.FC<any> } => {
  // 处理无效的 RSSI 值
  if (typeof rssi !== "number" || isNaN(rssi) || rssi === 0 || rssi === -999) {
    return { color: "#6B7280", level: 0, icon: SignalLow }; // 灰色表示无信号
  }

  if (rssi >= -50) {
    return { color: "#10B981", level: 4, icon: SignalHigh };
  } else if (rssi >= -70) {
    return { color: "#3B82F6", level: 3, icon: Signal };
  } else if (rssi >= -85) {
    return { color: "#F59E0B", level: 2, icon: Signal };
  } else {
    return { color: "#EF4444", level: 1, icon: SignalLow };
  }
};

// 根据 manufacturerData 判断设备类型和图标
const getDeviceTypeIcon = (
  manufacturerData?: string,
  deviceName?: string,
  deviceId?: string
): React.FC<any> => {
  // 如果已经缓存了，直接返回
  if (
    deviceId &&
    deviceTypeCache.has(deviceId) &&
    deviceTypeConfidence.get(deviceId) === "high"
  ) {
    console.log(
      `[DeviceType] 使用缓存: ${deviceId} -> ${deviceTypeCache.get(deviceId) === Tv ? "Tv" : "Bluetooth"}`
    );
    return deviceTypeCache.get(deviceId)!;
  }

  let detectedType: React.FC<any> = Bluetooth; // 默认类型
  let confidence: "high" | "medium" | "low" = "low";

  // TODO: 此处 Tv 假设，和后续如果充电宝有指定的 manufacturerData 则改为对应图标
  // TODO: 测试判断小米设备的 manufacturerData 格式， 如果后续充电宝有指定格式则改为对应逻辑

  // 首先尝试通过 manufacturerData 判断
  if (manufacturerData) {
    try {
      const buf = Buffer.from(manufacturerData, "base64");
      if (buf.length >= 8 && buf[7] === 0x1f) {
        detectedType = Tv;
        confidence = "high"; // manufacturerData 匹配是最高置信度
        console.log(
          `[DeviceType] manufacturerData 识别: ${deviceId} -> Tv (high confidence)`
        );
      }
    } catch (error) {
      console.warn("Failed to parse manufacturerData:", error);
    }
  }

  // 如果 manufacturerData 没有识别出 Tv，尝试通过设备名称判断
  if (detectedType === Bluetooth && deviceName) {
    const name = deviceName.toLowerCase();
    if (
      name.includes("power") ||
      name.includes("bank") ||
      name.includes("充电") ||
      name.includes("宝")
    ) {
      detectedType = Tv;
      confidence = "medium"; // 名称匹配是中等
      console.log(
        `[DeviceType] 设备名称识别: ${deviceId} (${deviceName}) -> Tv (medium confidence)`
      );
    }
  }

  // 只有在没有缓存或新检测的 confidence 更高时才更新
  if (deviceId) {
    const currentConfidence = deviceTypeConfidence.get(deviceId) || "low";
    const confidenceLevels = { low: 0, medium: 1, high: 2 };

    if (
      !deviceTypeCache.has(deviceId) ||
      confidenceLevels[confidence] > confidenceLevels[currentConfidence]
    ) {
      deviceTypeCache.set(deviceId, detectedType);
      deviceTypeConfidence.set(deviceId, confidence);
      console.log(
        `[DeviceType] 缓存更新: ${deviceId} -> ${detectedType === Tv ? "Tv" : "Bluetooth"} (${confidence})`
      );
    } else {
      // 如果缓存的 confidence 更高，返回缓存的值
      detectedType = deviceTypeCache.get(deviceId)!;
      console.log(
        `[DeviceType] 使用更高置信度缓存: ${deviceId} -> ${detectedType === Tv ? "Tv" : "Bluetooth"}`
      );
    }
  }

  return detectedType;
};

export default function AddDevicePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(
    new Set()
  );
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const devicesMapRef = useRef<Map<string, BluetoothDevice>>(new Map());
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
    confirmText: t("confirm"),
    showCancel: false,
  });
  // 启动蓝牙扫描
  const startScanning = async () => {
    try {
      setError(null);
      setDevices([]);
      setSelectedDevices(new Set());
      devicesMapRef.current.clear();
      // 清理设备类型缓存，为新的扫描会话做准备
      clearDeviceTypeCache();
      setIsScanning(true);

      const manager = await getBleManager();

      manager.startDeviceScan(null, null, (scanError, device) => {
        if (scanError) {
          console.error("Scan error:", scanError);
          return;
        }

        if (device && device.name) {
          let appearance: number | undefined;

          const bluetoothDevice: BluetoothDevice = {
            id: device.id,
            name: device.name,
            rssi: device.rssi || -999,
            appearance: appearance,
            serviceUUIDs: device.serviceUUIDs || [],
            manufacturerData: device.manufacturerData as string,
          };

          devicesMapRef.current.set(device.id, bluetoothDevice);
          const sortedDevices = Array.from(devicesMapRef.current.values()).sort(
            (a, b) => b.rssi - a.rssi
          );
          setDevices(sortedDevices);
        }
      });

      // 30秒后自动停止
      setTimeout(() => {
        stopScanning();
      }, 30000);
    } catch (err) {
      console.error("Scan error:", err);
      const errorMessage = err instanceof Error ? err.message : t("add-device-scan-failed");
      setError(errorMessage);
      setIsScanning(false);

      // 显示错误提示
      setAlertConfig({
        title: t("error"),
        message: `${t("add-device-error-unable-to-start-scan")}: ${errorMessage}`,
        primaryColor: "#EF4444",
        confirmText: t("confirm"),
        showCancel: false,
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    }
  };

  // 停止扫描
  const stopScanning = async () => {
    try {
      if (bleManager) {
        await bleManager.stopDeviceScan();
      }
      setIsScanning(false);
      // 不清理 deviceTypeCache，让识别结果在整个会话中保持
    } catch (err) {
      console.error("Stop scan error:", err);
    }
  };

  // 脉冲动画
  useEffect(() => {
    if (isScanning) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.8,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: false,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isScanning, scaleAnim, opacityAnim]);

  // 单选设备（点击切换选择/取消）
  const selectDevice = (deviceId: string) => {
    const updated = new Set(selectedDevices);
    if (updated.has(deviceId)) {
      updated.delete(deviceId);
    } else {
      updated.clear();
      updated.add(deviceId);
    }
    setSelectedDevices(updated);
  };

  // 确认添加选中的设备
  const confirmAddDevices = async () => {
    if (selectedDevices.size === 0) {
      setAlertConfig({
        title: t("tip"),
        message: t("add-device-chose-device"),
        confirmText: t("confirm"),
        showCancel: false,
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      return;
    }
    const deviceId = Array.from(selectedDevices)[0];
    const device = devices.find((d) => d.id === deviceId);

    if (!device) return;

    try {
      // 获取已保存的设备列表
      const existingDevicesJson = await AsyncStorage.getItem("devices");
      const existingDevices = existingDevicesJson
        ? JSON.parse(existingDevicesJson)
        : [];

      // 创建新设备对象
      const newDevice = {
        id: device.id,
        name: device.name,
        addedAt: new Date().toISOString(),
      };

      // 添加新设备到列表
      const updatedDevices = [...existingDevices, newDevice];

      // 保存到 AsyncStorage
      await AsyncStorage.setItem("devices", JSON.stringify(updatedDevices));

      // 显示成功提示并返回
      setAlertConfig({
        title: t("success"),
        message: `${t("add-device-add-success")}: ${device.name}`,
        primaryColor: "#10B981",
        confirmText: t("confirm"),
        showCancel: false,
        onConfirm: () => {
          setAlertVisible(false);
          setTimeout(() => {
            router.back();
          }, 300);
        },
      });
      setAlertVisible(true);
    } catch (err) {
      setAlertConfig({
        title: t("error"),
        message: t("add-device-error-save-failed"),
        primaryColor: "#EF4444",
        confirmText: t("confirm"),
        showCancel: false,
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      console.error("Save device error:", err);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle title={t("add-device-header-title")} showBack={true} />

      <View className="flex-1 py-4 bg-gray-100 dark:bg-black">
        {/* 扫描动画区域 - 固定高度 */}
        <View
          className="items-center justify-center"
          style={{ marginTop: insets.top, height: 280 }}
        >
          {/* 脉冲波纹 */}
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: "#FBBF24",
              position: "absolute",
            }}
          />

          {/* 中心图标 */}
          <View className="items-center justify-center w-40 h-40 rounded-full bg-yellow-300 dark:bg-yellow-400">
            <Bluetooth size={60} color="white" strokeWidth={1.5} />
          </View>
        </View>

        {/* 文字说明和卡片列表 - 可滚动区域 */}
        <View className="flex-1">
          <Text className="text-2xl text-center font-bold text-black dark:text-white mb-2 px-4">
            {isScanning
              ? t("add-device-scan-loading")
              : t("add-device-readying-scan")}
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400 text-center px-6 mb-8">
            {isScanning
              ? t("add-device-scan-loading-hint")
              : t("add-device-readying-scan-hint")}
          </Text>

          {/* 扫描到设备的列表 - 仅在扫描到设备时显示 */}
          {devices.length > 0 && (
            <View className="px-4 w-full mb-3">
              {/* <Text className="text-lg font-bold text-black dark:text-white mb-3">
                已找到 {devices.length} 个设备
              </Text> */}
              <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
                numColumns={2}
                columnWrapperStyle={{
                  justifyContent:
                    devices.length === 1 ? "flex-start" : "space-between",
                  marginBottom: 12,
                  gap: 12,
                }}
                nestedScrollEnabled={true}
                scrollIndicatorInsets={{ bottom: 0 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 50 }}
                renderItem={({ item }) => {
                  const rssiInfo = getRssiInfo(item.rssi);
                  const DeviceIcon = getDeviceTypeIcon(
                    item.manufacturerData,
                    item.name,
                    item.id
                  );
                  const isSelected = selectedDevices.has(item.id);

                  return (
                    <Pressable
                      onPress={() => selectDevice(item.id)}
                      className={`rounded-2xl overflow-hidden border-2 shadow-sm ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      }`}
                      style={{
                        width: "48%",
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                      }}
                      android_ripple={{ color: "rgba(59, 130, 246, 0.1)" }}
                    >
                      {/* 顶部：复选框和设备图标 */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View
                          className={`w-7 h-7 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <Check size={16} color="white" strokeWidth={3} />
                          )}
                        </View>
                        <View
                          className="w-10 h-10 rounded-lg items-center justify-center"
                          style={{ backgroundColor: `${rssiInfo.color}20` }}
                        >
                          <DeviceIcon
                            size={20}
                            color={rssiInfo.color}
                            strokeWidth={2}
                          />
                        </View>
                      </View>

                      {/* 设备名称 */}
                      <Text
                        className="text-sm font-semibold text-black dark:text-white mb-2"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      {/* 信号强度指示器 */}
                      <View className="flex-row items-center gap-2 mb-3">
                        <View className="flex-row items-center gap-1 flex-1">
                          {Array.from({ length: 4 }).map((_, idx) => (
                            <View
                              key={idx}
                              style={{
                                flex: 1,
                                height: 3,
                                backgroundColor:
                                  idx < rssiInfo.level
                                    ? rssiInfo.color
                                    : "#E5E7EB",
                                borderRadius: 1.5,
                              }}
                            />
                          ))}
                        </View>
                      </View>

                      {/* RSSI 值显示 */}
                      <View className="bg-gray-100 dark:bg-black/40 rounded-lg px-2 py-1.5">
                        <Text
                          className="text-xs font-medium text-gray-600 dark:text-gray-400"
                          numberOfLines={1}
                        >
                          {t("add-device-rssi-hint")}&nbsp;&nbsp;&nbsp;
                          {item.rssi} dBm
                        </Text>
                      </View>
                    </Pressable>
                  );
                }}
              />
            </View>
          )}
        </View>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryColor={alertConfig.primaryColor || "#007AFF"}
        confirmText={alertConfig.confirmText || t("confirm")}
        cancelText={alertConfig.cancelText || t("cancel")}
        showCancel={alertConfig.showCancel !== false}
        onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
        onCancel={() => setAlertVisible(false)}
      />

      {/* 底部操作按钮 */}
      <DeviceActionButtons
        primaryButton={{
          label: isScanning
            ? t("add-device-action-stop-scan")
            : t("add-device-action-start-scan"),
          backgroundColor: "bg-blue-500 dark:bg-blue-600",
          onPress: () => (isScanning ? stopScanning() : startScanning()),
        }}
        secondaryButton={{
          label: t("add-device-action-confirm"),
          backgroundColor: "bg-green-500 dark:bg-green-600",
          onPress: confirmAddDevices,
        }}
        showSecondary={selectedDevices.size > 0}
      />
    </>
  );
}
