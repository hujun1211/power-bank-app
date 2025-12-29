import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { Stack } from 'expo-router';
import { Vibrate, Volume2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function SoundNotificationPage() {
	const { t } = useTranslation();
	const [soundEnabled, setSoundEnabled] = useState(true);
	const [vibrationEnabled, setVibrationEnabled] = useState(true);

	const soundItems: MenuItem[] = [
		{
			id: 'sound',
			icon: <Volume2 size={24} color="#666" />,
			title: t('settings-notification-sound-enable'),
			subtitle: t('settings-notification-sound-enable-desc'),
			showSwitch: true,
			switchValue: soundEnabled,
			onSwitchChange: setSoundEnabled,
		},
		{
			id: 'vibration',
			icon: <Vibrate size={24} color="#666" />,
			title: t('settings-notification-vibration-enable'),
			subtitle: t('settings-notification-vibration-enable-desc'),
			showSwitch: true,
			switchValue: vibrationEnabled,
			onSwitchChange: setVibrationEnabled,
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-notification-sound-page-title')}
				showBack={true}
			/>
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="px-4 pt-4">
					<MenuList items={soundItems} />
				</View>
			</ScrollView>
		</>
	);
}
