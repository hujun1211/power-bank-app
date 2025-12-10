import MenuList, { MenuItem } from "@/components/ui/menu-list";
import TopTitle from "@/components/ui/top-title";
import { Stack, useRouter } from "expo-router";
import { Globe, Info, Palette } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function AppSettingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const settingsItems: MenuItem[] = [
    {
      id: "1",
      icon: <Palette size={24} color="#666" />,
      title: t("settings-app-setting-theme-title"),
      subtitle: t("settings-app-setting-theme-subtitle"),
      onPress: () => router.push("/(settings)/app-setting/theme"),
    },
    {
      id: "2",
      icon: <Globe size={24} color="#666" />,
      title: t("settings-app-setting-language-title"),
      subtitle: t("settings-app-setting-language-subtitle"),
      onPress: () => router.push("/(settings)/app-setting/lang"),
    },
    // {
    //   id: "3",
    //   icon: <Zap size={24} color="#666" />,
    //   title: t("settings-app-setting-zap-title"),
    //   subtitle: t("settings-app-setting-zap-subtitle"),
    // },
    {
      id: "3",
      icon: <Info size={24} color="#666" />,
      title: t("settings-app-setting-about-title"),
      subtitle: t("settings-app-setting-about-subtitle"),
      onPress: () => router.push("/(settings)/app-setting/about"),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle title={t("settings-app-setting-header-title")} showBack={true} />
      <ScrollView className="flex-1 bg-gray-100 dark:bg-black">
        <View className="px-4 mt-6">
          <MenuList items={settingsItems} />
        </View>
      </ScrollView>
    </>
  );
}
