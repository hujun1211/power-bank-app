import Card from "@/components/ui/card";
import TopTitle from "@/components/ui/top-title";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { Phone } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PhonePage() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [phone, setPhone] = useState('13800138000');

  const handleSave = () => {
    // 保存逻辑
    console.log('保存电话:', phone);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle title={t('settings-profile-phone-title')} showBack={true} />
      <View className="flex-1 bg-gray-100 dark:bg-black px-4 pt-6">
        <Card variant="elevated" className="p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Phone size={18} color={colorScheme === 'dark' ? 'white' : '#666'} />
            <Text className="text-lg font-semibold ml-2 text-gray-900 dark:text-white">
              {t('settings-profile-phone-change-title')}
            </Text>
          </View>

         <View className="flex-col gap-4">
            <View>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('settings-profile-phone-title')}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                placeholder="请输入电话号码"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              onPress={handleSave}
              className="bg-blue-500 rounded-lg p-3 items-center"
            >
              <Text className="text-white text-base font-semibold">保存</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </>
  );
}