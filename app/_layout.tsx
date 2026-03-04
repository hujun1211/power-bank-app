import { NotificationProvider } from '@/context/notification-context';
import { OnboardingContext } from '@/context/onboarding-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FileLogger } from 'react-native-file-logger';
import '../i18n';
import './global.css';

// 保持启动屏显示，直到我们完成状态检查和路由决定
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const router = useRouter();
	const segments = useSegments(); // 获取当前路由段，例如 ['', '(tabs)', 'home']

	// 状态：应用是否准备就绪（即 AsyncStorage 读取完毕）
	const [isReady, setIsReady] = useState(false);
	// 状态：是否看过 intro
	const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

	useEffect(() => {
		FileLogger.configure();

		async function checkOnboardingStatus() {
			try {
				const introValue = await AsyncStorage.getItem('hasSeenIntro');
				setHasSeenIntro(introValue === 'true');
			} catch (e) {
				console.error('AsyncStorage error:', e);
				setHasSeenIntro(false);
			} finally {
				setIsReady(true);
				SplashScreen.hideAsync();
			}
		}
		checkOnboardingStatus();
	}, []);

	useEffect(() => {
		if (!isReady) return;

		const inAuthGroup = segments[0] === '(welcome)';

		if (hasSeenIntro === false && !inAuthGroup) {
			router.replace('/(welcome)');
		} else if (hasSeenIntro === true && inAuthGroup) {
			router.replace('/(tabs)');
		}
	}, [hasSeenIntro, isReady, segments, router]);

	if (!isReady) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<OnboardingContext.Provider
				value={{ hasSeenIntro, setHasSeenIntro: (val) => setHasSeenIntro(val) }}
			>
				<NotificationProvider>
					<SafeAreaProvider>
						<ActionSheetProvider>
							<ThemeProvider
								value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
							>
								<Stack
									screenOptions={{
										headerShown: false,
										gestureEnabled: true,
										gestureDirection: 'horizontal',
										animation: 'slide_from_right',
									}}
								>
									<Stack.Screen
										name="(welcome)"
										options={{ animation: 'fade' }}
									/>

									<Stack.Screen
										name="(tabs)"
										options={{ animation: 'slide_from_right' }}
									/>

									<Stack.Screen
										name="(auth)"
										options={{ animation: 'fade_from_bottom' }}
									/>
								</Stack>

								<StatusBar style="auto" />
							</ThemeProvider>
						</ActionSheetProvider>
					</SafeAreaProvider>
				</NotificationProvider>
			</OnboardingContext.Provider>
		</GestureHandlerRootView>
	);
}
