import Card from "@/components/ui/card";
import TopTitle from "@/components/ui/top-title";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { Palette } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Appearance, Text, TouchableOpacity, View } from "react-native";

type ThemeOption = {
  id: 'light' | 'dark' | 'system';
  title: string;
  description: string;
};

export default function ThemePage() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system' | null>(null);

  useEffect(() => {
    // 初始化时检查当前设置
    const currentScheme = Appearance.getColorScheme();
    if (currentScheme === 'light') {
      setSelectedTheme('light');
    } else if (currentScheme === 'dark') {
      setSelectedTheme('dark');
    } else {
      setSelectedTheme('system');
    }
  }, []);

  const themeOptions: ThemeOption[] = [
    {
      id: 'light',
      title: t('settings-theme-light'),
      description: t('settings-theme-light-desc'),
    },
    {
      id: 'dark',
      title: t('settings-theme-dark'),
      description: t('settings-theme-dark-desc'),
    },
    {
      id: 'system',
      title: t('settings-theme-system'),
      description: t('settings-theme-system-desc'),
    },
  ];

  const handleThemeChange = (themeId: 'light' | 'dark' | 'system') => {
    setSelectedTheme(themeId);
    const theme = themeId === 'system' ? null : themeId;
    Appearance.setColorScheme(theme);
  };

  const getCurrentTheme = () => {
    return selectedTheme;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle title={t('settings-app-setting-theme-title')} showBack={true} />
      <View className="flex-1 bg-gray-100 dark:bg-black px-4 pt-6">
        <Card variant="elevated" className="p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Palette size={18} color={colorScheme === 'dark' ? 'white' : '#666'} />
            <Text className="text-lg font-semibold ml-2 text-gray-900 dark:text-white">
              {t('settings-app-setting-theme-change-title')}
            </Text>
          </View>

          {themeOptions.map((option) => {
            const isSelected = getCurrentTheme() === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleThemeChange(option.id)}
                className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                }`}
              >
                <View>
                  <Text
                    className={`text-base ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {option.title}
                  </Text>
                  {/* <Text
                    className={`text-sm mt-1 ${
                      isSelected
                        ? "text-blue-500 dark:text-blue-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {option.description}
                  </Text> */}
                </View>
                {isSelected && (
                  <View className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Text className="text-white text-xs">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>
    </>
  );
}