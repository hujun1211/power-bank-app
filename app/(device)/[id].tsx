import DeviceActionButtons from "@/components/ui/device-action-buttons";
import TopTitle from "@/components/ui/top-title";
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

const defaultDeviceDetails: Record<string, DeviceDetail> = {
  "1": {
    id: "1",
    name: "迷你充电宝",
    type: "5000mAh",
    color: "#3B82F6",
    capacity: "5000mAh",
    battery: 85,
    voltage: "5V/2A",
    temperature: "25°C",
    usageTime: "2小时",
    lastCharged: "2小时前",
  },
  "2": {
    id: "2",
    name: "中容量充电宝",
    type: "10000mAh",
    color: "#10B981",
    capacity: "10000mAh",
    battery: 60,
    voltage: "5V/2A",
    temperature: "28°C",
    usageTime: "4小时",
    lastCharged: "1天前",
  },
  "3": {
    id: "3",
    name: "大容量充电宝",
    type: "20000mAh",
    color: "#F59E0B",
    capacity: "20000mAh",
    battery: 92,
    voltage: "5V/3A",
    temperature: "24°C",
    usageTime: "8小时",
    lastCharged: "3小时前",
  },
  "4": {
    id: "4",
    name: "超大容量充电宝",
    type: "30000mAh",
    color: "#EF4444",
    capacity: "30000mAh",
    battery: 100,
    voltage: "5V/3A",
    temperature: "22°C",
    usageTime: "12小时",
    lastCharged: "30分钟前",
  },
};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <LinearGradient
      colors={["#F9FAFB", "#F9FAFB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 12,
      }}
      className="flex-row items-center gap-4 p-4 mb-3 border border-gray-200"
    >
      <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center flex-shrink-0">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs text-gray-500 font-medium mb-1">{label}</Text>
        <Text className="text-base font-semibold text-gray-900">{value}</Text>
      </View>
    </LinearGradient>
  );
}

export default function DeviceDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deviceId = id || "1";
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
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
      title: "确认",
      message: `是否删除设备 "${device?.name}"?`,
      confirmText: "删除",
      cancelText: "取消",
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
            title: "错误",
            message: "删除设备失败",
            primaryColor: "#EF4444",
            confirmText: "确定",
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
      <View className="flex-1 bg-white">
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
              <Text className="text-base text-white/80">固件版本 v2.5.1</Text>
              <ChevronRight size={16} color="white" strokeWidth={2} />
            </Pressable>
          </View>
          <View className="flex-row mb-2 " style={{ gap: 12 }}>
            {/* 电池百分比 */}
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={["#EFF6FF", "#DBEAFE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs text-gray-600">电量</Text>
                  <Battery size={18} color="#3B82F6" strokeWidth={2} />
                </View>
                <Text className="text-2xl font-bold text-blue-600 mb-2">
                  {device.battery || 0}%
                </Text>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${device.battery || 0}%` }}
                  />
                </View>
              </LinearGradient>
            </View>

            {/* 充放电状态 */}
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={["#F0FDF4", "#DCFCE7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs text-gray-600">状态</Text>
                  <Zap size={18} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-lg font-bold text-green-600">充电中</Text>
                <Text className="text-xs text-green-500 mt-1">剩余 2 小时</Text>
              </LinearGradient>
            </View>

            {/* 定位地图 */}
            <Pressable
              onPress={() => router.push(`/(device)/map`)}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={["#FAF5FF", "#F3E8FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  flex: 1,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs text-gray-600">位置</Text>
                  <MapPin size={18} color="#A855F7" strokeWidth={2} />
                </View>
                <Text className="text-xs text-purple-600 font-semibold mb-2">
                  深圳市南山区
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-xs text-purple-500">查看地图</Text>
                  <ChevronRight size={14} color="#A855F7" strokeWidth={2} />
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View className="px-4">
          <Text className="text-2xl font-bold text-black mb-2">设备详情</Text>
        </View>

        {/* Details Section */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="p-4">
            <DetailItem
              icon={<Battery size={20} color="black" />}
              label="容量"
              value={device.capacity || "20000mAh"}
            />

            <DetailItem
              icon={<BatteryPlus size={20} color="black" />}
              label="电池健康"
              value={device.batteryHealth || "95%"}
            />

            <DetailItem
              icon={<Zap size={20} color="black" />}
              label="输出电压"
              value={device.voltage || "未知"}
            />

            <DetailItem
              icon={<Thermometer size={20} color="black" />}
              label="当前温度"
              value={device.temperature || "未知"}
            />

            <DetailItem
              icon={<Clock size={20} color="black" />}
              label="使用时长"
              value={device.usageTime || "未知"}
            />

            <DetailItem
              icon={<Droplet size={20} color="black" />}
              label="最后充电"
              value={device.lastCharged || "未知"}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <DeviceActionButtons
          primaryButton={{
            label: "移除设备",
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
        confirmText={alertConfig.confirmText || "确认"}
        cancelText={alertConfig.cancelText || "取消"}
        showCancel={alertConfig.showCancel !== false}
        onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
        onCancel={() => setAlertVisible(false)}
      />
    </>
  );
}
