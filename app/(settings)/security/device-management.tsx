import Card from '@/components/ui/card';
import CustomAlert from '@/components/ui/system-alert';
import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Device {
	id: string;
	name: string;
	type: 'phone' | 'computer' | 'tablet';
	lastActive: string;
	current: boolean;
}

export default function DeviceManagementPage() {
	const { t } = useTranslation();
	const colorScheme = useColorScheme();
	const [alertVisible, setAlertVisible] = useState(false);
	const [selectedDevice, setSelectedDevice] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Mock device data - in real app this would come from API
	const devices: Device[] = [
		{
			id: '1',
			name: 'iPhone 15 Pro',
			type: 'phone',
			lastActive: t('settings-security-device-current-device'),
			current: true,
		},
		{
			id: '2',
			name: 'MacBook Pro',
			type: 'computer',
			lastActive: '2024-01-15 14:30',
			current: false,
		},
		{
			id: '3',
			name: 'iPad Air',
			type: 'tablet',
			lastActive: '2024-01-10 09:15',
			current: false,
		},
		{
			id: '4',
			name: 'Windows PC',
			type: 'computer',
			lastActive: '2024-01-15 19:25',
			current: false,
		},
	];

	const handleRemoveDevice = (deviceId: string, deviceName: string) => {
		setSelectedDevice({ id: deviceId, name: deviceName });
		setAlertVisible(true);
	};

	const handleConfirmRemove = () => {
		if (selectedDevice) {
			// TODO: Implement device removal logic
			console.log(`Remove device ${selectedDevice.id}`);
			setAlertVisible(false);
			setSelectedDevice(null);
		}
	};

	const handleCancelRemove = () => {
		setAlertVisible(false);
		setSelectedDevice(null);
	};

	const getDeviceIcon = (type: string) => {
		return type === 'phone' ? (
			<Smartphone size={24} color={colorScheme === 'dark' ? 'white' : '#666'} />
		) : type === 'tablet' ? (
			<Tablet size={24} color={colorScheme === 'dark' ? 'white' : '#666'} />
		) : (
			<Monitor size={24} color={colorScheme === 'dark' ? 'white' : '#666'} />
		);
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-security-device-management-page-title')}
				showBack={true}
			/>
			<ScrollView className="flex-1 bg-gray-100 dark:bg-black">
				<View className="px-4 pt-4">
					<Card
						variant="elevated"
						title={t('settings-security-device-management-page-title')}
						icon={<Monitor size={18} />}
					>
						<View className="p-4">
							{/* <Text className="text-lg font-semibold text-black dark:text-white mb-4">
                {t("settings-security-device-list-title")}
              </Text> */}

							{devices.map((device, index) => (
								<View key={device.id}>
									<View className="flex-row items-center justify-between py-3">
										<View className="flex-1 flex-row items-center">
											{getDeviceIcon(device.type)}
											<View className="ml-3 flex-1">
												<Text className="text-base font-medium text-black dark:text-white">
													{device.name}
												</Text>
												<Text className="text-sm text-gray-500 dark:text-gray-400">
													{device.lastActive}
												</Text>
											</View>
										</View>

										{!device.current && (
											<TouchableOpacity
												className="p-2"
												onPress={() =>
													handleRemoveDevice(device.id, device.name)
												}
											>
												<Trash2 size={20} color="#ef4444" />
											</TouchableOpacity>
										)}
									</View>

									{index < devices.length - 1 && (
										<View className="border-b border-gray-200 dark:border-gray-700" />
									)}
								</View>
							))}

							<View className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
								<Text className="text-sm text-blue-700 dark:text-blue-300">
									{t('settings-security-device-info')}
								</Text>
							</View>
						</View>
					</Card>
				</View>
			</ScrollView>

			<CustomAlert
				visible={alertVisible}
				title={t('settings-security-device-remove-title')}
				message={t('settings-security-device-remove-message', {
					device: selectedDevice?.name || '',
				})}
				confirmText={t('common-remove')}
				cancelText={t('common-cancel')}
				primaryColor="#ef4444"
				onConfirm={handleConfirmRemove}
				onCancel={handleCancelRemove}
			/>
		</>
	);
}
