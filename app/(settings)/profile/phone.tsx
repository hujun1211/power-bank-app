import Card from '@/components/ui/card';
import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { Phone } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PhonePage() {
	const { t } = useTranslation();
	const colorScheme = useColorScheme();
	const [phone, setPhone] = useState('13800138000');

	const handleSave = () => {
		// 保存逻辑
		console.log('保存电话:', phone);
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={t('settings-profile-phone-title')} showBack={true} />
			<View className="flex-1 bg-gray-100 px-4 pt-4 dark:bg-black">
				<Card
					variant="elevated"
					title={t('settings-profile-phone-change-title')}
					icon={<Phone size={18} />}
					className="mb-4"
				>
					<View className="p-4">
						<View className="flex-col gap-4">
							<View>
								<Text className="mb-2 text-sm text-gray-500 dark:text-gray-400">
									{t('settings-profile-phone-title')}
								</Text>
								<TextInput
									value={phone}
									onChangeText={setPhone}
									className="rounded-lg border border-gray-300 bg-white p-3 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									placeholder={t('settings-profile-phone-placeholder')}
									placeholderTextColor="#999"
									keyboardType="phone-pad"
								/>
							</View>
							<TouchableOpacity
								onPress={handleSave}
								className="items-center rounded-lg bg-blue-500 p-3"
							>
								<Text className="text-base font-semibold text-white">
									{t('save')}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Card>
			</View>
		</>
	);
}
