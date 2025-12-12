import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { useRouter } from 'expo-router';
import {
	ChevronLeft,
	Eye,
	EyeOff,
	Lock,
	Smartphone,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Keyboard,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginPasswordPage() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { replace } = useDebouncedNavigation(500);
	const colorScheme = useColorScheme();

	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
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
				replace('/(tabs)');
			}
		}, 1000);
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<View
				className="flex-1 bg-gray-50 dark:bg-gray-900"
				style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
			>
				{/* 导航栏 */}
				<View className="h-14 flex-row items-center justify-between px-4">
					<TouchableOpacity
						onPress={() => {
							router.back();
						}}
						className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800"
					>
						<ChevronLeft
							size={24}
							color={colorScheme === 'dark' ? 'white' : '#333'}
						/>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
						<Text className="font-medium text-blue-600">
							{t('login-top-register')}
						</Text>
					</TouchableOpacity>
				</View>

				<View className="flex-1 px-8 pt-10">
					<View className="mb-10">
						<Text className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
							{t('login-title')} 👋
						</Text>
						<Text className="text-lg text-gray-500 dark:text-gray-400">
							{t('login-subtitle')}
						</Text>
					</View>

					{/* Tab 切换：点击验证码登录跳转回 login 路由 */}
					<View className="mb-8 flex-row rounded-xl bg-gray-200 p-1 dark:bg-gray-700">
						<TouchableOpacity
							className="flex-1 items-center rounded-lg py-2"
							onPress={() => replace('/(auth)/login')}
						>
							<Text className="font-medium text-gray-500 dark:text-gray-400">
								{t('login-tab-code')}
							</Text>
						</TouchableOpacity>
						<View className="flex-1 items-center rounded-lg bg-white py-2 shadow-sm dark:bg-gray-800">
							<Text className="font-medium text-gray-900 dark:text-white">
								{t('login-tab-password')}
							</Text>
						</View>
					</View>

					{/* 表单区域：只有手机号+密码 */}
					<View className="space-y-4">
						<View className="h-14 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
							<Smartphone size={20} color="#9CA3AF" />
							<TextInput
								className="ml-3 flex-1 text-base text-gray-900 dark:text-white"
								placeholder={t('login-phone-placeholder')}
								value={phone}
								onChangeText={setPhone}
								keyboardType="phone-pad"
							/>
						</View>
						<View className="mt-4 h-14 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
							<Lock size={20} color="#9CA3AF" />
							<TextInput
								className="ml-3 flex-1 text-base text-gray-900 dark:text-white"
								placeholder={t('login-code-placeholder')}
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
							className="mt-6 h-14 items-center justify-center rounded-2xl bg-black dark:bg-gray-800"
						>
							{isLoading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text className="text-lg font-bold text-white">
									{t('login-password-button')}
								</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
}
