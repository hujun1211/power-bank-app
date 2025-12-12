import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import CustomAlert from '@/utils/my-alert';
import { useRouter } from 'expo-router';
import { ChevronLeft, KeyRound, Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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

export default function LoginCodePage() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { t } = useTranslation();
	const { push, replace } = useDebouncedNavigation(500);
	const colorScheme = useColorScheme();
	const [phone, setPhone] = useState('');
	const [code, setCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertTitle, setAlertTitle] = useState('');
	const [alertMessage, setAlertMessage] = useState('');

	useEffect(() => {
		let interval: any;
		if (countdown > 0)
			interval = setInterval(() => setCountdown((p) => p - 1), 1000);
		return () => clearInterval(interval);
	}, [countdown]);

	const handleSendCode = () => {
		if (!phone) {
			setAlertTitle(t('tip'));
			setAlertMessage(t('login-phone-placeholder'));
			setAlertVisible(true);
			return;
		}
		setCountdown(60);
	};

	const handleLogin = () => {
		setIsLoading(true);
		setTimeout(() => {
			setIsLoading(false);
			if (router.canGoBack()) {
				router.back();
			} else {
				push('/(tabs)');
			}
		}, 1000);
	};

	return (
		<>
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

						{/* Tab 切换 */}
						<View className="mb-8 flex-row rounded-xl bg-gray-200 p-1 dark:bg-gray-700">
							<View className="flex-1 items-center rounded-lg bg-white py-2 shadow-sm dark:bg-gray-800">
								<Text className="font-medium text-gray-900 dark:text-white">
									{t('login-tab-code')}
								</Text>
							</View>
							<TouchableOpacity
								className="flex-1 items-center rounded-lg py-2"
								onPress={() => replace('/(auth)/login-pass')}
							>
								<Text className="font-medium text-gray-500 dark:text-gray-400">
									{t('login-tab-password')}
								</Text>
							</TouchableOpacity>
						</View>

						{/* 表单区域 */}
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
								<KeyRound size={20} color="#9CA3AF" />
								<TextInput
									className="ml-3 flex-1 text-base text-gray-900 dark:text-white"
									placeholder={t('login-code-placeholder')}
									value={code}
									onChangeText={setCode}
									keyboardType="number-pad"
									maxLength={6}
								/>
								<TouchableOpacity
									onPress={handleSendCode}
									disabled={countdown > 0}
									className="border-l border-gray-200 pl-3 dark:border-gray-600"
								>
									<Text
										className={
											countdown > 0
												? 'text-gray-400'
												: 'text-blue-600 dark:text-blue-400'
										}
									>
										{countdown > 0 ? `${countdown}s` : t('login-tab-code-hint')}
									</Text>
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
										{t('login-code-button')}
									</Text>
								)}
							</TouchableOpacity>
							<Text className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
								{t('login-phone-bottom-hint')}
							</Text>
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
			<CustomAlert
				visible={alertVisible}
				title={alertTitle}
				message={alertMessage}
				onConfirm={() => setAlertVisible(false)}
				showCancel={false}
			/>
		</>
	);
}
