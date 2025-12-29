import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { Stack } from 'expo-router';
import { Bell, Settings, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function PushNotificationPage() {
	const { t } = useTranslation();
	const [pushEnabled, setPushEnabled] = useState(true);
	const [systemNotifications, setSystemNotifications] = useState(true);
	const [deviceNotifications, setDeviceNotifications] = useState(true);

	const pushItems: MenuItem[] = [
		{
			id: 'enable',
			icon: <Bell size={24} color="#666" />,
			title: t('settings-notification-push-enable'),
			subtitle: t('settings-notification-push-enable-desc'),
			showSwitch: true,
			switchValue: pushEnabled,
			onSwitchChange: setPushEnabled,
		},
		{
			id: 'system',
			icon: <Settings size={24} color="#666" />,
			title: t('settings-notification-push-system'),
			subtitle: t('settings-notification-push-system-desc'),
			showSwitch: true,
			switchValue: systemNotifications,
			onSwitchChange: setSystemNotifications,
		},
		{
			id: 'device',
			icon: <Zap size={24} color="#666" />,
			title: t('settings-notification-push-device'),
			subtitle: t('settings-notification-push-device-desc'),
			showSwitch: true,
			switchValue: deviceNotifications,
			onSwitchChange: setDeviceNotifications,
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-notification-push-page-title')}
				showBack={true}
			/>
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="px-4 pt-4">
					<MenuList items={pushItems} />
				</View>
			</ScrollView>
		</>
	);
}
