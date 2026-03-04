import { CustomTabBar } from '@/components/custom-tab-bar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs, useFocusEffect } from 'expo-router';
import { Home, User } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, BackHandler, Platform, ToastAndroid } from 'react-native';
import RNExitApp from 'react-native-exit-app';

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const { t } = useTranslation();

	// 双击返回退出应用
	const lastBackPress = useRef(0);

	useFocusEffect(
		useCallback(() => {
			if (Platform.OS !== 'android') return;

			const onBackPress = () => {
				const now = Date.now();

				/*
				 * Android 上仅调用 BackHandler.exitApp() 时，冷启动后偶现页面过渡动画丢失。
				 */
				if (lastBackPress.current && now - lastBackPress.current < 2000) {
					const subscription = AppState.addEventListener(
						'change',
						(nextAppState) => {
							if (nextAppState === 'background') {
								RNExitApp.exitApp();
								subscription.remove();
							}
						}
					);

					BackHandler.exitApp();
					return true;
				}

				// 第一次返回
				lastBackPress.current = now;
				ToastAndroid.show(t('press-back-again-to-exit'), ToastAndroid.SHORT);
				return true;
			};

			const subscription = BackHandler.addEventListener(
				'hardwareBackPress',
				onBackPress
			);

			return () => subscription.remove();
		}, [t])
	);

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
				headerShown: false,
			}}
			tabBar={(props) => <CustomTabBar {...props} />}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t('tab-home'),
					tabBarIcon: ({ color }) => <Home size={28} color={color} />,
				}}
			/>

			<Tabs.Screen
				name="mine"
				options={{
					title: t('tab-mine'),
					tabBarIcon: ({ color }) => <User size={28} color={color} />,
				}}
			/>
		</Tabs>
	);
}
