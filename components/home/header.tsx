import { useRouter } from "expo-router";
import { Bell, CircleUser } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="p-4 flex-row items-center justify-between"
      style={{ paddingTop: insets.top + 25, paddingBottom: insets.bottom }}
    >
      <Pressable
        onPress={() => {
          router.push("/(auth)/login");
        }}
        className="flex gap-2"
      >
        <View className="flex-row items-center justify-start gap-2">
          <CircleUser size={24} color="black" />
          <Text className="text-2xl font-bold text-black dark:text-white">
            登录
          </Text>
        </View>

        <View className="flex items-center justify-start">
          <Text className="text-sm text-gray-800 dark:text-white">
            登录以获取更多功能
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-center justify-center gap-4">
        {/* <Pressable
          onPress={() => router.push("/notifications")}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: true }}
          className="p-2 rounded-full"
        >
          <Plus size={28} color="black" />
        </Pressable> */}
        <Pressable
          onPress={() => router.push("/notifications")}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: true }}
          className="p-2 rounded-full"
        >
          <Bell size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
}
