import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { Stack } from 'expo-router';
import { Bell, Mail, MessageSquare, Volume2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function NotificationPage() {
	const { t } = useTranslation();
	const { push: debouncedPush } = useDebouncedNavigation();

	const notificationItems: MenuItem[] = [
		{
			id: '1',
			icon: <Bell size={24} color="#666" />,
			title: t('settings-notification-push-title'),
			subtitle: t('settings-notification-push-subtitle'),
			onPress: () => debouncedPush('/(settings)/notification/push'),
		},
		{
			id: '2',
			icon: <Mail size={24} color="#666" />,
			title: t('settings-notification-email-title'),
			subtitle: t('settings-notification-email-subtitle'),
			onPress: () => debouncedPush('/(settings)/notification/email'),
		},
		{
			id: '3',
			icon: <MessageSquare size={24} color="#666" />,
			title: t('settings-notification-sms-title'),
			subtitle: t('settings-notification-sms-subtitle'),
			onPress: () => debouncedPush('/(settings)/notification/sms'),
		},
		{
			id: '4',
			icon: <Volume2 size={24} color="#666" />,
			title: t('settings-notification-sound-title'),
			subtitle: t('settings-notification-sound-subtitle'),
			onPress: () => debouncedPush('/(settings)/notification/sound'),
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-notification-header-title')}
				showBack={true}
			/>
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="mt-6 px-4">
					<MenuList items={notificationItems} />
				</View>
			</ScrollView>
		</>
	);
}
