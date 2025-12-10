import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDebouncedNavigation } from "@/hooks/use-debounced-navigation";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginPasswordPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { replace } = useDebouncedNavigation(500);
  const colorScheme = useColorScheme();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (router.canGoBack()) {
        router.back();
      } else {
        replace("/(tabs)");
      }
    }, 0);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        className="flex-1 bg-gray-50 dark:bg-gray-900"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* 导航栏 */}
        <View className="flex-row items-center justify-between px-4 h-14">
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
            className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-sm"
          >
            <ChevronLeft size={24} color={colorScheme === "dark" ? "white" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text className="text-blue-600 font-medium">
              {t("login-top-register")}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-8 pt-10">
          <View className="mb-10">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t("login-title")} 👋
            </Text>
            <Text className="text-lg text-gray-500 dark:text-gray-400">{t("login-subtitle")}</Text>
          </View>

          {/* Tab 切换：点击验证码登录跳转回 login 路由 */}
          <View className="flex-row mb-8 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl">
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              onPress={() => replace("/(auth)/login")}
            >
              <Text className="font-medium text-gray-500 dark:text-gray-400">
                {t("login-tab-code")}
              </Text>
            </TouchableOpacity>
            <View className="flex-1 py-2 rounded-lg items-center bg-white dark:bg-gray-800 shadow-sm">
              <Text className="font-medium text-gray-900 dark:text-white">
                {t("login-tab-password")}
              </Text>
            </View>
          </View>

          {/* 表单区域：只有手机号+密码 */}
          <View className="space-y-4">
            <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 h-14 border border-gray-100 dark:border-gray-700 shadow-sm">
              <Smartphone size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
                placeholder={t("login-phone-placeholder")}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 h-14 border border-gray-100 dark:border-gray-700 shadow-sm mt-4">
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
                placeholder={t("login-code-placeholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleLogin}
              className="bg-black dark:bg-gray-800 h-14 rounded-2xl items-center justify-center mt-6"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-bold">
                  {t("login-password-button")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
