import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { Stack } from 'expo-router';
import { MessageSquare, Shield, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function SmsNotificationPage() {
	const { t } = useTranslation();
	const [smsEnabled, setSmsEnabled] = useState(true);
	const [verificationSms, setVerificationSms] = useState(true);
	const [marketingSms, setMarketingSms] = useState(false);

	const smsItems: MenuItem[] = [
		{
			id: 'enable',
			icon: <Smartphone size={24} color="#666" />,
			title: t('settings-notification-sms-enable'),
			subtitle: t('settings-notification-sms-enable-desc'),
			showSwitch: true,
			switchValue: smsEnabled,
			onSwitchChange: setSmsEnabled,
		},
		{
			id: 'verification',
			icon: <Shield size={24} color="#666" />,
			title: t('settings-notification-sms-verification'),
			subtitle: t('settings-notification-sms-verification-desc'),
			showSwitch: true,
			switchValue: verificationSms,
			onSwitchChange: setVerificationSms,
		},
		{
			id: 'marketing',
			icon: <MessageSquare size={24} color="#666" />,
			title: t('settings-notification-sms-marketing'),
			subtitle: t('settings-notification-sms-marketing-desc'),
			showSwitch: true,
			switchValue: marketingSms,
			onSwitchChange: setMarketingSms,
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-notification-sms-page-title')}
				showBack={true}
			/>
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="px-4 pt-4">
					<MenuList items={smsItems} />
				</View>
			</ScrollView>
		</>
	);
}
