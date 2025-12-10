import MenuList, { MenuItem } from "@/components/ui/menu-list";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDebouncedNavigation } from "@/hooks/use-debounced-navigation";
import { useRouter } from "expo-router";
import { Bell, LogOut, Settings, Shield, User } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";



export default function Mine() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { replace, push } = useDebouncedNavigation(500);
  const menuItems: MenuItem[] = [
    {
      id: "1",
      icon: <User size={24} color="#666" />,
      title: t("mine-menu-profile-title"),
      subtitle: t("mine-menu-profile-subtitle"),
      onPress: () => {
        push("/(settings)/profile");
      },
    },
    {
      id: "2",
      icon: <Bell size={24} color="#666" />,
      title: t("mine-menu-notification-title"),
      subtitle: t("mine-menu-notification-subtitle"),
      onPress: () => {
        push("/(settings)/notification");
      },
    },
    {
      id: "3",
      icon: <Shield size={24} color="#666" />,
      title: t("mine-menu-security-title"),
      subtitle: t("mine-menu-security-subtitle"),
      onPress: () => {
        push("/(settings)/security");
      },
    },
    {
      id: "4",
      icon: <Settings size={24} color="#666" />,
      title: t("mine-menu-settings-title"),
      subtitle: t("mine-menu-settings-subtitle"),
      onPress: () => {
        push("/(settings)/app-setting");
      },
    },
  ];

  return (
    <View className="flex-1 bg-gray-100 dark:bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 20 }}
      >
        {/* 用户头部卡片 */}
        <View className="px-4 py-6">
          <View className="bg-white/60 dark:bg-gray-700 rounded-3xl p-6 flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-yellow-300 items-center justify-center mr-4 flex-shrink-0">
              <User size={40} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-black dark:text-white">
                用户名
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                user@example.com
              </Text>
            </View>
          </View>
        </View>

        {/* 菜单项 */}
        <View className="px-4">
          <MenuList items={menuItems} />
        </View>

        {/* 登出按钮 */}
        <View className="px-4 mt-6">
          <Pressable
            className="rounded-2xl p-4 bg-red-400 dark:bg-red-950 flex-row items-center justify-center border border-red-200 dark:border-red-800"
            android_ripple={{ color: "rgba(220, 38, 38, 0.1)" }}
          >
            <LogOut size={20} color="#fff" />
            <Text className="text-white dark:text-red-400 text-base font-medium ml-2">
              {t("mine-menu-action-logout")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
