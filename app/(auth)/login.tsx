import { useRouter } from "expo-router";
import { ChevronLeft, KeyRound, Smartphone } from "lucide-react-native";
import { useEffect, useState } from "react";
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

export default function LoginCodePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let interval: any;
    if (countdown > 0)
      interval = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSendCode = () => {
    if (!phone) return alert("请输入手机号");
    setCountdown(60);
  };

    const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push("/(tabs)");
      }
    }, 1000);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        className="flex-1 bg-gray-50"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* 导航栏 */}
        <View className="flex-row items-center justify-between px-4 h-14">
          <TouchableOpacity
            onPress={() => {
              router.replace("/(tabs)");
            }}
            className="h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text className="text-blue-600 font-medium">注册账号</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-8 pt-10">
          <View className="mb-10">
            <Text className="text-3xl font-bold text-gray-900 mb-3">
              欢迎回来 👋
            </Text>
            <Text className="text-lg text-gray-500">登录以继续使用</Text>
          </View>

          {/* Tab 切换 */}
          <View className="flex-row mb-8 bg-gray-200 p-1 rounded-xl">
            <View className="flex-1 py-2 rounded-lg items-center bg-white shadow-sm">
              <Text className="font-medium text-gray-900">验证码登录</Text>
            </View>
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              onPress={() => router.replace("/(auth)/login-pass")}
            >
              <Text className="font-medium text-gray-500">密码登录</Text>
            </TouchableOpacity>
          </View>

          {/* 表单区域 */}
          <View className="space-y-4">
            <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm">
              <Smartphone size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base"
                placeholder="请输入手机号码"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm mt-4">
              <KeyRound size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base"
                placeholder="请输入验证码"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                onPress={handleSendCode}
                disabled={countdown > 0}
                className="border-l border-gray-200 pl-3"
              >
                <Text
                  className={countdown > 0 ? "text-gray-400" : "text-blue-600"}
                >
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleLogin}
              className="bg-black h-14 rounded-2xl items-center justify-center mt-6"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-bold">
                  登录 / 注册
                </Text>
              )}
            </TouchableOpacity>
            <Text className="text-xs text-center text-gray-500 mt-4">
              未注册的手机号验证后将自动创建账号
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
