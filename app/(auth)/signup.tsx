import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { useRouter } from 'expo-router';
import {
	CheckCircle2,
	ChevronLeft,
	Circle,
	Eye,
	EyeOff,
	KeyRound,
	Lock,
	Smartphone,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Keyboard,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '@/components/ui/system-alert';

export default function SignUpPage() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { replace } = useDebouncedNavigation(500);
	const colorScheme = useColorScheme();
	// 表单状态
	const [phone, setPhone] = useState('');
	const [code, setCode] = useState('');
	const [password, setPassword] = useState('');
	const { t } = useTranslation();

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
		title: '',
		message: '',
		confirmText: '确认',
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
				title: t('tip'),
				message: t('register-alert-message-phone-required'),
				confirmText: t('confirm'),
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
				title: t('tip'),
				message: t('register-alert-message-info-required'),
				confirmText: t('confirm'),
				showCancel: false,
				onConfirm: () => setAlertVisible(false),
			});
			setAlertVisible(true);
			return;
		}

		if (!isAgreed) {
			setAlertConfig({
				title: t('tip'),
				message: t('register-alert-message-agreement-required'),
				confirmText: t('confirm'),
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
				title: t('tip'),
				message: t('register-alert-message-success'),
				primaryColor: '#10B981',
				confirmText: t('confirm'),
				showCancel: false,
				onConfirm: () => {
					setAlertVisible(false);
					replace('/(tabs)');
				},
			});
			setAlertVisible(true);
		}, 1500);
	};

	return (
		<>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View
					className="flex-1 bg-gray-50 dark:bg-gray-900"
					style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
				>
					{/* 顶部导航栏 */}
					<View className="h-14 flex-row items-center justify-between px-4">
						<TouchableOpacity
							onPress={() =>
								router.canGoBack() ? router.back() : replace('/(auth)/login')
							}
							className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800"
						>
							<ChevronLeft
								size={24}
								color={colorScheme === 'dark' ? 'white' : '#333'}
							/>
						</TouchableOpacity>
					</View>

					{/* 使用 ScrollView 保证在小屏手机上也能滚动，且避免键盘冲突 */}
					<ScrollView
						className="flex-1"
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						<View className="px-8 pb-20 pt-6">
							{/* 标题 */}
							<View className="mb-10">
								<Text className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
									{t('register-title')} 🚀
								</Text>
								<Text className="text-lg text-gray-500 dark:text-gray-400">
									{t('register-subtitle')}
								</Text>
							</View>

							{/* 表单区域 - 垂直排列，互不干扰 */}
							<View className="space-y-4">
								{/* 手机号 */}
								<View className="h-14 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
									<Smartphone size={20} color="#9CA3AF" />
									<TextInput
										className="ml-3 flex-1 text-base text-gray-900 dark:text-white"
										placeholder={t('register-phone-placeholder')}
										placeholderTextColor="#9CA3AF"
										keyboardType="phone-pad"
										value={phone}
										onChangeText={setPhone}
									/>
								</View>

								{/* 验证码 */}
								<View className="mt-4 h-14 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
									<KeyRound size={20} color="#9CA3AF" />
									<TextInput
										className="ml-3 flex-1 text-base text-gray-900 dark:text-white"
										placeholder={t('register-code-placeholder')}
										placeholderTextColor="#9CA3AF"
										keyboardType="number-pad"
										value={code}
										onChangeText={setCode}
										maxLength={6}
									/>
									<TouchableOpacity
										onPress={handleSendCode}
										disabled={countdown > 0}
										className="border-l border-gray-200 py-1 pl-3 dark:border-gray-600"
									>
										<Text
											className={`text-sm font-medium ${countdown > 0 ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}
										>
											{countdown > 0
												? `${countdown}s`
												: t('register-code-hint')}
										</Text>
									</TouchableOpacity>
								</View>

								{/* 设置密码 */}
								<View className="mt-4 h-14 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
									<Lock size={20} color="#9CA3AF" />
									<TextInput
										className="ml-3 flex-1 text-base text-gray-900 dark:text-white"
										placeholder={t('register-password-placeholder')}
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
									className="mt-4 flex-row items-center"
									onPress={() => setIsAgreed(!isAgreed)}
									activeOpacity={0.8}
								>
									<View className="mt-0.5">
										{isAgreed ? (
											<CheckCircle2
												size={13}
												color={colorScheme === 'dark' ? 'white' : 'black'}
												fill={colorScheme === 'dark' ? 'white' : 'black'}
												className="text-black"
											/>
										) : (
											<Circle size={13} color="#9CA3AF" />
										)}
									</View>
									<Text className="ml-2 flex-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
										{t('register-bottom-hint-pre')}
										<Text className="font-medium text-blue-600 dark:text-blue-400">
											{t('register-bottom-agreement-1')}
										</Text>
										{t('register-bottom-hint-and')}
										<Text className="font-medium text-blue-600 dark:text-blue-400">
											{t('register-bottom-agreement-2')}
										</Text>
									</Text>
								</TouchableOpacity>

								{/* 注册按钮 */}
								<TouchableOpacity
									onPress={handleSignUp}
									disabled={isLoading}
									className={`mt-6 h-14 items-center justify-center rounded-2xl ${
										isAgreed
											? 'bg-black dark:bg-gray-800'
											: 'bg-gray-300 dark:bg-gray-600' // 未勾选协议时按钮变灰
									}`}
								>
									{isLoading ? (
										<ActivityIndicator color="white" />
									) : (
										<Text className="text-lg font-bold text-white">
											{t('register-button')}
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
				primaryColor={alertConfig.primaryColor || '#007AFF'}
				confirmText={alertConfig.confirmText || t('confirm')}
				cancelText={alertConfig.cancelText || t('cancel')}
				showCancel={alertConfig.showCancel !== false}
				onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
				onCancel={() => setAlertVisible(false)}
			/>
		</>
	);
}
