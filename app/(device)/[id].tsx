import DeviceActionButtons from "@/components/ui/device-action-buttons";
import TopTitle from "@/components/ui/top-title";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDebouncedNavigation } from "@/hooks/use-debounced-navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Battery,
  BatteryPlus,
  ChevronRight,
  Clock,
  Droplet,
  MapPin,
  Package,
  Thermometer,
  Zap,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert from "../../utils/my-alert";

interface DeviceDetail {
  id: string;
  name: string;
  type?: string;
  color?: string;
  capacity?: string;
  battery?: number;
  voltage?: string;
  batteryHealth?: string;
  temperature?: string;
  usageTime?: string;
  lastCharged?: string;
  addedAt?: string;
}

const defaultDeviceDetails: Record<string, DeviceDetail> = {};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  const colorScheme = useColorScheme();
  return (
    <LinearGradient
      colors={
        colorScheme === "dark" ? ["#374151", "#374151"] : ["#F3F4F6", "#F3F4F6"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 12,
      }}
      className="flex-row items-center gap-4 p-4 mb-3"
    >
      <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg items-center justify-center flex-shrink-0">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
          {label}
        </Text>
        <Text className="text-base font-semibold text-gray-900 dark:text-white">
          {value}
        </Text>
      </View>
    </LinearGradient>
  );
}

export default function DeviceDetailPage() {
  const { push } = useDebouncedNavigation(500);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deviceId = id || "1";
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadDevice = async () => {
    try {
      const devicesJson = await AsyncStorage.getItem("devices");
      if (devicesJson) {
        const savedDevices = JSON.parse(devicesJson);
        const foundDevice = savedDevices.find((d: any) => d.id === deviceId);
        if (foundDevice) {
          // 分配颜色
          const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
          const colorIndex = savedDevices.indexOf(foundDevice);
          setDevice({
            ...foundDevice,
            color: colors[colorIndex % 4],
            battery: 85,
            voltage: "5V/2A",
            temperature: "25°C",
            usageTime: "2小时",
            lastCharged: "2小时前",
          });
          setLoading(false);
          return;
        }
      }
      // 如果没找到，使用默认数据
      const defaultDevice = defaultDeviceDetails[deviceId];
      setDevice(defaultDevice || null);
      setLoading(false);
    } catch (err) {
      console.error("Load device error:", err);
      const defaultDevice = defaultDeviceDetails[deviceId];
      setDevice(defaultDevice || null);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevice();
  }, [deviceId, loadDevice]);

  const handleRemoveDevice = async () => {
    setAlertConfig({
      title: t("tip"),
      message: `${t("device-detail-alert-confirm-delete-device")} "${device?.name}"?`,
      confirmText: t("confirm"),
      cancelText: t("cancel"),
      primaryColor: "#EF4444",
      showCancel: true,
      onConfirm: async () => {
        try {
          const devicesJson = await AsyncStorage.getItem("devices");
          if (devicesJson) {
            const savedDevices = JSON.parse(devicesJson);
            const updatedDevices = savedDevices.filter(
              (d: any) => d.id !== deviceId
            );
            await AsyncStorage.setItem(
              "devices",
              JSON.stringify(updatedDevices)
            );
            setAlertVisible(false);
            setTimeout(() => router.back(), 0);
          }
        } catch (err) {
          setAlertConfig({
            title: t("error"),
            message: t("device-detail-alert-delete-device-failed"),
            primaryColor: "#EF4444",
            confirmText: t("confirm"),
            showCancel: false,
            onConfirm: () => setAlertVisible(false),
          });
          console.error("Delete device error:", err);
        }
      },
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  };

  if (loading || !device) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle title={device.name} showBack={true} />
      <View className="flex-1 bg-white dark:bg-black">
        {/* Device Card */}
        <View className="p-4">
          <View
            className="rounded-2xl p-8 items-center justify-center mb-6"
            style={{
              backgroundColor: device.color,
              height: 200,
            }}
          >
            <Zap size={48} color="white" />
            <Text className="text-white text-2xl font-bold mt-2">
              {device.name}
            </Text>
            <Text className="text-white/80 text-lg">{device.type}</Text>

            {/* Firmware Version */}
            <Pressable
              onPress={() => router.push(`/(device)/ota`)}
              className="flex-row items-center gap-1 mt-3"
            >
              <Package size={14} color="white" strokeWidth={2} />
              <Text className="text-base text-white/80">
                {t("device-detail-ota-version")} v2.5.1
              </Text>
              <ChevronRight size={16} color="white" strokeWidth={2} />
            </Pressable>
          </View>
          <View className="flex-row mb-2 " style={{ gap: 12 }}>
            {/* 电池百分比 */}
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={
                  colorScheme === "dark"
                    ? ["#1E3A8A", "#1E40AF"]
                    : ["#EFF6FF", "#DBEAFE"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs text-gray-600 dark:text-gray-200">
                    {t("device-detail-power")}
                  </Text>
                  <Battery
                    size={18}
                    color={colorScheme === "dark" ? "#60A5FA" : "#3B82F6"}
                    strokeWidth={2}
                  />
                </View>
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {device.battery || 0}%
                </Text>
                <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                    style={{ width: `${device.battery || 0}%` }}
                  />
                </View>
              </LinearGradient>
            </View>

            {/* 充放电状态 */}
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={
                  colorScheme === "dark"
                    ? ["#064E3B", "#065F46"]
                    : ["#F0FDF4", "#DCFCE7"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs text-gray-600 dark:text-gray-200">
                    {t("device-detail-status")}
                  </Text>
                  <Zap
                    size={18}
                    color={colorScheme === "dark" ? "#34D399" : "#10B981"}
                    strokeWidth={2}
                  />
                </View>
                <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                  {t("device-detail-status-charging")}
                </Text>
                <Text className="text-xs text-green-500 dark:text-green-400 mt-1">
                  {t("device-detail-status-time-remaining")} 2 小时
                </Text>
              </LinearGradient>
            </View>

            {/* 定位地图 */}
            <Pressable
              onPress={() =>
                push({
                  pathname: "/(device)/map",
                  params: { lng: "120.123", lat: "30.456" },
                })
              }
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={
                  colorScheme === "dark"
                    ? ["#581C87", "#7C3AED"]
                    : ["#FAF5FF", "#F3E8FF"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  flex: 1,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs text-gray-600 dark:text-gray-200">
                    {t("device-detail-location")}
                  </Text>
                  <MapPin
                    size={18}
                    color={colorScheme === "dark" ? "#C084FC" : "#A855F7"}
                    strokeWidth={2}
                  />
                </View>
                <Text className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-2">
                  深圳市南山区
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-xs text-purple-500 dark:text-purple-400">
                    {t("device-detail-location-map")}
                  </Text>
                  <ChevronRight
                    size={14}
                    color={colorScheme === "dark" ? "#C084FC" : "#A855F7"}
                    strokeWidth={2}
                  />
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View className="px-4">
          <Text className="text-2xl font-bold text-black dark:text-white mb-2">
            {t("device-detail-info-title")}
          </Text>
        </View>

        {/* Details Section */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="p-4">
            <DetailItem
              icon={
                <Battery
                  size={20}
                  color={colorScheme === "dark" ? "white" : "black"}
                />
              }
              label={t("device-detail-info-capacity")}
              value={device.capacity || "20000mAh"}
            />

            <DetailItem
              icon={
                <BatteryPlus
                  size={20}
                  color={colorScheme === "dark" ? "white" : "black"}
                />
              }
              label={t("device-detail-info-battery-health")}
              value={device.batteryHealth || "95%"}
            />

            <DetailItem
              icon={
                <Zap
                  size={20}
                  color={colorScheme === "dark" ? "white" : "black"}
                />
              }
              label={t("device-detail-info-output-voltage")}
              value={device.voltage || t("unknown")}
            />

            <DetailItem
              icon={
                <Thermometer
                  size={20}
                  color={colorScheme === "dark" ? "white" : "black"}
                />
              }
              label={t("device-detail-info-current-temperature")}
              value={device.temperature || t("unknown")}
            />

            <DetailItem
              icon={
                <Clock
                  size={20}
                  color={colorScheme === "dark" ? "white" : "black"}
                />
              }
              label={t("device-detail-info-usage-time")}
              value={device.usageTime || t("unknown")}
            />

            <DetailItem
              icon={
                <Droplet
                  size={20}
                  color={colorScheme === "dark" ? "white" : "black"}
                />
              }
              label={t("device-detail-info-last-charged")}
              value={device.lastCharged || t("unknown")}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <DeviceActionButtons
          primaryButton={{
            label: t("device-detail-action-delete"),
            backgroundColor: "bg-gray-400 dark:bg-gray-800",
            onPress: handleRemoveDevice,
          }}
          showSecondary={false}
        />
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
    </>
  );
}
