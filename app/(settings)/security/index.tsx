import MenuList, { MenuItem } from "@/components/ui/menu-list";
import TopTitle from "@/components/ui/top-title";
import { Stack } from "expo-router";
import { Key, Lock, ShieldCheck, Smartphone } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function SecurityPage() {
  const { t } = useTranslation();
  const securityItems: MenuItem[] = [
    {
      id: "1",
      icon: <Lock size={24} color="#666" />,
      title: t("settings-security-password-title"),
      subtitle: t("settings-security-password-subtitle"),
    },
    {
      id: "2",
      icon: <Key size={24} color="#666" />,
      title: t("settings-security-payment-password-title"),
      subtitle: t("settings-security-payment-password-subtitle"),
    },
    {
      id: "3",
      icon: <Smartphone size={24} color="#666" />,
      title: t("settings-security-device-management-title"),
      subtitle: t("settings-security-device-management-subtitle"),
    },
    {
      id: "4",
      icon: <ShieldCheck size={24} color="#666" />,
      title: t("settings-security-privacy-title"),
      subtitle: t("settings-security-privacy-subtitle"),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle title={t("settings-security-header-title")} showBack={true} />
      <ScrollView className="flex-1 bg-gray-100 dark:bg-black">
        <View className="px-4 mt-6">
          <MenuList items={securityItems} />
        </View>
      </ScrollView>
    </>
  );
}