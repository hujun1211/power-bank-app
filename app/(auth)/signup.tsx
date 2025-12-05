import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Smartphone,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert from "../../utils/my-alert";

export default function SignUpPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 表单状态
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  // UI 交互状态
  const [showPassword, setShowPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    primaryColor?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    title: "",
    message: "",
    confirmText: "确认",
    showCancel: false,
  });

  // 倒计时逻辑
  useEffect(() => {
    let interval: any;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = () => {
    if (!phone) {
      setAlertConfig({
        title: "提示",
        message: "请输入手机号码",
        confirmText: "确定",
        showCancel: false,
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      return;
    }
    // 这里可以加正则校验手机号
    setCountdown(60);
    // TODO: 调用发送验证码接口
  };

  // 处理注册
  const handleSignUp = async () => {
    if (!phone || !code || !password) {
      setAlertConfig({
        title: "提示",
        message: "请填写完整注册信息",
        confirmText: "确定",
        showCancel: false,
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      return;
    }

    if (!isAgreed) {
      setAlertConfig({
        title: "提示",
        message: "请先阅读并同意用户协议",
        confirmText: "确定",
        showCancel: false,
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);

    // 模拟注册请求
    setTimeout(() => {
      setIsLoading(false);
      // 注册成功后，通常跳转到 Tabs 或 登录页
      setAlertConfig({
        title: "注册成功",
        message: "欢迎加入我们！",
        primaryColor: "#10B981",
        confirmText: "开始使用",
        showCancel: false,
        onConfirm: () => {
          setAlertVisible(false);
          router.replace("/(tabs)");
        },
      });
      setAlertVisible(true);
    }, 1500);
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          className="flex-1 bg-gray-50"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* 顶部导航栏 */}
          <View className="flex-row items-center justify-between px-4 h-14">
            <TouchableOpacity
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace("/(auth)/login")
              }
              className="h-10 w-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <ChevronLeft size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* 使用 ScrollView 保证在小屏手机上也能滚动，且避免键盘冲突 */}
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-8 pt-6 pb-20">
              {/* 标题 */}
              <View className="mb-10">
                <Text className="text-3xl font-bold text-gray-900 mb-3">
                  创建新账号 🚀
                </Text>
                <Text className="text-lg text-gray-500">
                  注册即可体验更多精彩功能
                </Text>
              </View>

              {/* 表单区域 - 垂直排列，互不干扰 */}
              <View className="space-y-4">
                {/* 手机号 */}
                <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm">
                  <Smartphone size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-900"
                    placeholder="请输入手机号码"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {/* 验证码 */}
                <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm mt-4">
                  <KeyRound size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-900"
                    placeholder="请输入验证码"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
                    maxLength={6}
                  />
                  <TouchableOpacity
                    onPress={handleSendCode}
                    disabled={countdown > 0}
                    className="border-l border-gray-200 pl-3 py-1"
                  >
                    <Text
                      className={`text-sm font-medium ${countdown > 0 ? "text-gray-400" : "text-blue-600"}`}
                    >
                      {countdown > 0 ? `${countdown}s` : "获取验证码"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 设置密码 */}
                <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm mt-4">
                  <Lock size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-900"
                    placeholder="设置登录密码"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* 用户协议勾选 */}
                <TouchableOpacity
                  className="flex-row items-center mt-4"
                  onPress={() => setIsAgreed(!isAgreed)}
                  activeOpacity={0.8}
                >
                  <View className="mt-0.5">
                    {isAgreed ? (
                      <CheckCircle2
                        size={13}
                        color="#000"
                        fill="#000"
                        className="text-black"
                      />
                    ) : (
                      <Circle size={13} color="#9CA3AF" />
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 ml-2 flex-1 leading-5">
                    我已阅读并同意
                    <Text className="text-blue-600 font-medium">
                      《用户服务协议》
                    </Text>
                    和
                    <Text className="text-blue-600 font-medium">
                      《隐私政策》
                    </Text>
                  </Text>
                </TouchableOpacity>

                {/* 注册按钮 */}
                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={isLoading}
                  className={`h-14 rounded-2xl items-center justify-center mt-6 ${
                    isAgreed ? "bg-black" : "bg-gray-300" // 未勾选协议时按钮变灰
                  }`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-bold">
                      立即注册
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* 底部引导去登录 */}
              {/* <View className="flex-1 justify-end pt-10 items-center flex-row justify-center">
              <Text className="text-gray-500">已有账号？</Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text className="text-blue-600 font-bold ml-1">去登录</Text>
              </TouchableOpacity>
            </View> */}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryColor={alertConfig.primaryColor || "#007AFF"}
        confirmText={alertConfig.confirmText || "确认"}
        cancelText={alertConfig.cancelText || "取消"}
        showCancel={alertConfig.showCancel !== false}
        onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
        onCancel={() => setAlertVisible(false)}
      />
    </>
  );
}
