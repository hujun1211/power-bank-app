import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { Stack } from 'expo-router';
import { Bell, Eye, MapPin, Users } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function PrivacyPage() {
	const { t } = useTranslation();

	const [privacySettings, setPrivacySettings] = useState({
		profileVisible: true,
		locationSharing: false,
		activityStatus: true,
		dataCollection: false,
	});

	const handleSwitchChange = (key: keyof typeof privacySettings) => {
		setPrivacySettings((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const privacyItems: MenuItem[] = [
		{
			id: '1',
			icon: <Eye size={24} color="#666" />,
			title: t('settings-security-privacy-profile-visible-title'),
			subtitle: t('settings-security-privacy-profile-visible-subtitle'),
			showSwitch: true,
			switchValue: privacySettings.profileVisible,
			onSwitchChange: () => handleSwitchChange('profileVisible'),
		},
		{
			id: '2',
			icon: <MapPin size={24} color="#666" />,
			title: t('settings-security-privacy-location-title'),
			subtitle: t('settings-security-privacy-location-subtitle'),
			showSwitch: true,
			switchValue: privacySettings.locationSharing,
			onSwitchChange: () => handleSwitchChange('locationSharing'),
		},
		{
			id: '3',
			icon: <Users size={24} color="#666" />,
			title: t('settings-security-privacy-activity-title'),
			subtitle: t('settings-security-privacy-activity-subtitle'),
			showSwitch: true,
			switchValue: privacySettings.activityStatus,
			onSwitchChange: () => handleSwitchChange('activityStatus'),
		},
		{
			id: '4',
			icon: <Bell size={24} color="#666" />,
			title: t('settings-security-privacy-data-title'),
			subtitle: t('settings-security-privacy-data-subtitle'),
			showSwitch: true,
			switchValue: privacySettings.dataCollection,
			onSwitchChange: () => handleSwitchChange('dataCollection'),
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-security-privacy-page-title')}
				showBack={true}
			/>
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="px-4 pt-4">
					<MenuList items={privacyItems} />
				</View>
			</ScrollView>
		</>
	);
}
