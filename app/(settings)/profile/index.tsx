import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { Mail, Phone, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

// 配置通知处理
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

export default function ProfilePage() {
	const { t } = useTranslation();
	const { push: debouncedPush } = useDebouncedNavigation();
	const handleUsernameClick = async () => {
		try {
			// 先请求通知权限
			const { status } = await Notifications.requestPermissionsAsync();

			if (status !== 'granted') {
				console.warn('通知权限被拒绝');
				return;
			}

			// 权限获取成功，发送本地推送通知
			await Notifications.scheduleNotificationAsync({
				content: {
					title: '✓ 个人信息已更新',
					body: '您的个人信息已成功更新，请查看通知中心了解详情',
					data: { type: 'profile_updated' },
					sound: 'default',
					badge: 1,
				},
				trigger: null, // 立即发送
			});
		} catch (err) {
			console.error('Push notification error:', err);
		}
	};

	const profileItems: MenuItem[] = [
		{
			id: '1',
			icon: <User size={24} color="#666" />,
			title: t('settings-profile-username-title'),
			subtitle: t('settings-profile-username-subtitle'),
			onPress: () => debouncedPush('/(settings)/profile/username'),
		},
		{
			id: '2',
			icon: <Mail size={24} color="#666" />,
			title: t('settings-profile-email-title'),
			subtitle: t('settings-profile-email-subtitle'),
			onPress: () => debouncedPush('/(settings)/profile/email'),
		},
		{
			id: '3',
			icon: <Phone size={24} color="#666" />,
			title: t('settings-profile-phone-title'),
			subtitle: t('settings-profile-phone-subtitle'),
			onPress: () => debouncedPush('/(settings)/profile/phone'),
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={t('settings-profile-header-title')} showBack={true} />
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="mt-6 px-4">
					<MenuList items={profileItems} />
				</View>
			</ScrollView>
		</>
	);
}
