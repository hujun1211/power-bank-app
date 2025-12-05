import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CircleOff,
  LayoutGrid,
  LayoutList,
  Plus,
  Zap,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

interface DeviceItem {
  id: string;
  name: string;
  type?: string;
  color: string;
  addedAt?: string;
}

const defaultDevices: DeviceItem[] = [
  { id: "1", name: "迷你充电宝", type: "5000mAh", color: "#3B82F6" },
  { id: "2", name: "中容量充电宝", type: "10000mAh", color: "#10B981" },
  { id: "3", name: "大容量充电宝", type: "20000mAh", color: "#F59E0B" },
  { id: "4", name: "超大容量充电宝", type: "30000mAh", color: "#EF4444" },
];

export function Device() {
  const router = useRouter();
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [devices, setDevices] = useState<DeviceItem[]>(defaultDevices);

  // 加载已保存的设备
  const loadDevices = useCallback(async () => {
    try {
      const devicesJson = await AsyncStorage.getItem("devices");
      if (devicesJson) {
        const savedDevices = JSON.parse(devicesJson);
        // 为每个设备添加颜色
        const devicesWithColor = savedDevices.map(
          (device: any, idx: number) => ({
            ...device,
            color: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"][idx % 4],
          })
        );
        setDevices(devicesWithColor);
      } else {
        setDevices(defaultDevices);
      }
    } catch (err) {
      console.error("Load devices error:", err);
      setDevices(defaultDevices);
    }
  }, []);

  // 当页面获得焦点时重新加载设备
  useFocusEffect(
    useCallback(() => {
      loadDevices();
    }, [loadDevices])
  );

  const renderDeviceCard = ({ item }: { item: DeviceItem }) => (
    <Pressable
      onPress={() => router.push(`/(device)/${item.id}`)}
      android_ripple={{ color: "rgba(0, 0, 0, 0.1)" }}
      style={{
        flex: isGridView ? 0.5 : 1,
        marginVertical: 8,
      }}
    >
      <View
        className="rounded-2xl p-4 items-center justify-center"
        style={{
          backgroundColor: item.color,
          height: 140,
        }}
      >
        <Zap size={32} color="white" />
        <Text className="text-white text-base font-semibold mt-2">
          {item.name}
        </Text>
        <Text className="text-white/80 text-xs mt-1">{item.type}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="text-2xl font-semibold text-black dark:text-white">
          我的设备
        </Text>
        <View className="flex-row items-center justify-center gap-4">
          <Pressable onPress={() => router.push("/(device)/add")}>
            <Plus size={28} color="black" />
          </Pressable>
          <Pressable onPress={() => setIsGridView(!isGridView)}>
            {isGridView ? (
              <LayoutGrid size={24} color="black" />
            ) : (
              <LayoutList size={24} color="black" />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {devices.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <CircleOff size={68} color="#9CA3AF" />
            <Text className="text-gray-500 text-xl mt-4">暂无设备</Text>

            <View className="flex-row items-center justify-center mt-2">
              <Text className="flex text-gray-400 text-base">点击</Text>
              <Plus size={15} color="black" />
              <Text className="flex text-gray-400 text-base">添加设备</Text>
            </View>
          </View>
        ) : (
          <FlatList
            key={isGridView ? "grid" : "list"}
            data={devices}
            renderItem={renderDeviceCard}
            keyExtractor={(item) => item.id}
            numColumns={isGridView ? 2 : 1}
            scrollEnabled={false}
            columnWrapperStyle={
              isGridView
                ? {
                    justifyContent: "flex-start",
                    gap: 12,
                    paddingHorizontal: 12,
                  }
                : undefined
            }
            contentContainerStyle={{
              paddingHorizontal: isGridView ? 0 : 12,
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}
