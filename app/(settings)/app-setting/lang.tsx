import Card from "@/components/ui/card";
import TopTitle from "@/components/ui/top-title";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { Globe } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import i18n from "../../../i18n";

const languages = [
  { code: "zh", name: "中文" },
  { code: "en", name: "English" },
];

export default function LanguagePage() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopTitle
        title={t("settings-app-setting-language-title")}
        showBack={true}
      />
      <View className="flex-1 bg-gray-100 dark:bg-black px-4 pt-6">
        <Card variant="elevated" className="p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Globe size={18} color={colorScheme === 'dark' ? 'white' : '#666'} />
            <Text className="text-lg font-semibold ml-2 text-gray-900 dark:text-white">
              {t("settings-app-setting-language-change-title")}
            </Text>
          </View>

          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                currentLanguage === lang.code
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                  : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              <View className="flex-row items-center">
                <Text
                  className={`text-base ${
                    currentLanguage === lang.code
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {lang.name}
                </Text>
              </View>
              {currentLanguage === lang.code && (
                <View className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {t("settings-app-setting-language-subtitle")}
          </Text>
        </View> */}
      </View>
    </>
  );
}
