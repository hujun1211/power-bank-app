import MenuList, { MenuItem } from '@/components/ui/menu-list';
import TopTitle from '@/components/ui/top-title';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { Stack } from 'expo-router';
import { Key, Lock, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function SecurityPage() {
	const { t } = useTranslation();
	const { push: debouncedPush } = useDebouncedNavigation();
	const securityItems: MenuItem[] = [
		{
			id: '1',
			icon: <Lock size={24} color="#666" />,
			title: t('settings-security-password-title'),
			subtitle: t('settings-security-password-subtitle'),
			onPress: () => debouncedPush('/(settings)/security/password'),
		},
		{
			id: '2',
			icon: <Key size={24} color="#666" />,
			title: t('settings-security-payment-password-title'),
			subtitle: t('settings-security-payment-password-subtitle'),
			onPress: () => debouncedPush('/(settings)/security/payment-password'),
		},
		{
			id: '3',
			icon: <Smartphone size={24} color="#666" />,
			title: t('settings-security-device-management-title'),
			subtitle: t('settings-security-device-management-subtitle'),
			onPress: () => debouncedPush('/(settings)/security/device-management'),
		},
		{
			id: '4',
			icon: <ShieldCheck size={24} color="#666" />,
			title: t('settings-security-privacy-title'),
			subtitle: t('settings-security-privacy-subtitle'),
			onPress: () => debouncedPush('/(settings)/security/privacy'),
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={t('settings-security-header-title')} showBack={true} />
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="mt-4 px-4">
					<MenuList items={securityItems} />
				</View>
			</ScrollView>
		</>
	);
}
