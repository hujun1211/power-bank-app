import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { Stack } from 'expo-router';
import { Mail, Megaphone, Shield } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function EmailNotificationPage() {
	const { t } = useTranslation();
	const [emailEnabled, setEmailEnabled] = useState(true);
	const [marketingEmails, setMarketingEmails] = useState(false);
	const [securityEmails, setSecurityEmails] = useState(true);

	const emailItems: MenuItem[] = [
		{
			id: 'enable',
			icon: <Mail size={24} color="#666" />,
			title: t('settings-notification-email-enable'),
			subtitle: t('settings-notification-email-enable-desc'),
			showSwitch: true,
			switchValue: emailEnabled,
			onSwitchChange: setEmailEnabled,
		},
		{
			id: 'marketing',
			icon: <Megaphone size={24} color="#666" />,
			title: t('settings-notification-email-marketing'),
			subtitle: t('settings-notification-email-marketing-desc'),
			showSwitch: true,
			switchValue: marketingEmails,
			onSwitchChange: setMarketingEmails,
		},
		{
			id: 'security',
			icon: <Shield size={24} color="#666" />,
			title: t('settings-notification-email-security'),
			subtitle: t('settings-notification-email-security-desc'),
			showSwitch: true,
			switchValue: securityEmails,
			onSwitchChange: setSecurityEmails,
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-notification-email-page-title')}
				showBack={true}
			/>
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="px-4 pt-4">
					<MenuList items={emailItems} />
				</View>
			</ScrollView>
		</>
	);
}
