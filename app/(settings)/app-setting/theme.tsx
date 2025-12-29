import Card from '@/components/ui/card';
import RadioSelect, { SelectOption } from '@/components/ui/radio-select';
import TopTitle from '@/components/ui/top-title';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { Palette } from 'lucide-react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Appearance, View } from 'react-native';

export default function ThemePage() {
	const { t } = useTranslation();
	const { setColorScheme } = useNativeWindColorScheme();
	const [selectedTheme, setSelectedTheme] = useState<
		'light' | 'dark' | 'system' | null
	>(null);

	useEffect(() => {
		const loadThemePreference = async () => {
			try {
				const storedTheme = await AsyncStorage.getItem('themePreference');
				if (storedTheme) {
					setSelectedTheme(storedTheme as 'light' | 'dark' | 'system');
				} else {
					// 如果没有存储的设置，默认选择系统跟随
					setSelectedTheme('system');
				}
			} catch (error) {
				console.error('加载主题偏好设置失败:', error);
				setSelectedTheme('system');
			}
		};

		loadThemePreference();
	}, []);

	const themeOptions: SelectOption<'light' | 'dark' | 'system'>[] = [
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

	const handleThemeChange = async (themeId: 'light' | 'dark' | 'system') => {
		try {
			setSelectedTheme(themeId);
			await AsyncStorage.setItem('themePreference', themeId);

			if (themeId === 'system') {
				setColorScheme('system');
				Appearance.setColorScheme(null);
			} else {
				setColorScheme(themeId);
				Appearance.setColorScheme(themeId);
			}
		} catch (error) {
			console.error('保存主题偏好设置失败:', error);
		}
	};

	const getCurrentTheme = () => {
		return selectedTheme;
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={t('settings-app-setting-theme-title')} showBack={true} />
			<View className="flex-1 bg-gray-100 px-4 pt-4 dark:bg-black">
				<Card
					variant="elevated"
					title={t('settings-app-setting-theme-change-title')}
					icon={<Palette size={18} />}
				>
					<RadioSelect
						options={themeOptions}
						selectedId={getCurrentTheme()}
						onSelect={handleThemeChange}
					/>
				</Card>
			</View>
		</>
	);
}
