import BottomModal from '@/components/ui/bottom-modal';
import DeviceActionButtons from '@/components/ui/device-action-buttons';
import CustomAlert from '@/components/ui/system-alert';
import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
	ArrowDownUp,
	Battery,
	BatteryPlus,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Clock,
	Droplet,
	MapPin,
	Package,
	Thermometer,
	Zap,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// 定义存储 Key
const STORAGE_KEY_SORT_ORDER = 'device_detail_sort_order';

interface DeviceDetail {
	id: string;
	name: string;
	type?: string;
	color?: string;
	capacity?: string;
	battery?: number;
	voltage?: string;
	batteryHealth?: string;
	temperature?: string;
	usageTime?: string;
	lastCharged?: string;
	addedAt?: string;
}

const defaultDeviceDetails: Record<string, DeviceDetail> = {};

interface DetailItemProps {
	icon: React.ReactNode;
	label: string;
	value: string;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
	const colorScheme = useColorScheme();
	return (
		<LinearGradient
			colors={
				colorScheme === 'dark' ? ['#374151', '#374151'] : ['#F3F4F6', '#F3F4F6']
			}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{
				borderRadius: 12,
			}}
			className="mb-3 flex-row items-center gap-4 p-4"
		>
			<View className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
				{icon}
			</View>
			<View className="flex-1">
				<Text className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
					{label}
				</Text>
				<Text className="text-base font-semibold text-gray-900 dark:text-white">
					{value}
				</Text>
			</View>
		</LinearGradient>
	);
}

export default function DeviceDetailPage() {
	const { push } = useDebouncedNavigation(500);
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const deviceId = id || '1';
	const [device, setDevice] = useState<DeviceDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [alertVisible, setAlertVisible] = useState(false);
	const [settingsModalVisible, setSettingsModalVisible] = useState(false);

	// 默认顺序
	const [itemOrder, setItemOrder] = useState([
		'capacity',
		'batteryHealth',
		'voltage',
		'temperature',
		'usageTime',
		'lastCharged',
	]);

	const { t } = useTranslation();
	const colorScheme = useColorScheme();
	const [alertConfig, setAlertConfig] = useState<{
		title: string;
		message: string;
		primaryColor?: string;
		confirmText?: string;
		cancelText?: string;
		showCancel?: boolean;
		onConfirm?: () => void;
		onCancel?: () => void;
	}>({
		title: '',
		message: '',
		confirmText: t('confirm'),
		showCancel: false,
	});

	// 加载保存的排序
	useEffect(() => {
		const loadSortOrder = async () => {
			try {
				const savedOrder = await AsyncStorage.getItem(STORAGE_KEY_SORT_ORDER);
				if (savedOrder) {
					setItemOrder(JSON.parse(savedOrder));
				}
			} catch (error) {
				console.error('Failed to load sort order:', error);
			}
		};
		loadSortOrder();
	}, []);

	// 更新顺序并保存到本地
	const updateItemOrder = async (newOrder: string[]) => {
		setItemOrder(newOrder); // 更新 UI
		try {
			await AsyncStorage.setItem(
				STORAGE_KEY_SORT_ORDER,
				JSON.stringify(newOrder)
			); // 保存到存储
		} catch (error) {
			console.error('Failed to save sort order:', error);
		}
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const loadDevice = async () => {
		try {
			const devicesJson = await AsyncStorage.getItem('devices');
			if (devicesJson) {
				const savedDevices = JSON.parse(devicesJson);
				const foundDevice = savedDevices.find((d: any) => d.id === deviceId);
				if (foundDevice) {
					const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
					const colorIndex = savedDevices.indexOf(foundDevice);
					setDevice({
						...foundDevice,
						color: colors[colorIndex % 4],
						battery: 85,
						voltage: '5V/2A',
						temperature: '25°C',
						usageTime: '2小时',
						lastCharged: '2小时前',
					});
					setLoading(false);
					return;
				}
			}
			const defaultDevice = defaultDeviceDetails[deviceId];
			setDevice(defaultDevice || null);
			setLoading(false);
		} catch (err) {
			console.error('Load device error:', err);
			const defaultDevice = defaultDeviceDetails[deviceId];
			setDevice(defaultDevice || null);
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDevice();
	}, [deviceId, loadDevice]);

	const renderDetailItem = (key: string) => {
		const items = {
			capacity: {
				icon: (
					<Battery
						size={20}
						color={colorScheme === 'dark' ? 'white' : 'black'}
					/>
				),
				label: t('device-detail-info-capacity'),
				value: device?.capacity || '20000mAh',
			},
			batteryHealth: {
				icon: (
					<BatteryPlus
						size={20}
						color={colorScheme === 'dark' ? 'white' : 'black'}
					/>
				),
				label: t('device-detail-info-battery-health'),
				value: device?.batteryHealth || '95%',
			},
			voltage: {
				icon: (
					<Zap size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
				),
				label: t('device-detail-info-output-voltage'),
				value: device?.voltage || t('unknown'),
			},
			temperature: {
				icon: (
					<Thermometer
						size={20}
						color={colorScheme === 'dark' ? 'white' : 'black'}
					/>
				),
				label: t('device-detail-info-current-temperature'),
				value: device?.temperature || t('unknown'),
			},
			usageTime: {
				icon: (
					<Clock size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
				),
				label: t('device-detail-info-usage-time'),
				value: device?.usageTime || t('unknown'),
			},
			lastCharged: {
				icon: (
					<Droplet
						size={20}
						color={colorScheme === 'dark' ? 'white' : 'black'}
					/>
				),
				label: t('device-detail-info-last-charged'),
				value: device?.lastCharged || t('unknown'),
			},
		};
		const item = items[key as keyof typeof items];
		if (!item) return null;
		return <DetailItem key={key} {...item} />;
	};

	const handleRemoveDevice = () => {
		setAlertConfig({
			title: t('tip'),
			message: `${t('device-detail-alert-confirm-delete-device')} "${device?.name}"?`,
			confirmText: t('confirm'),
			cancelText: t('cancel'),
			primaryColor: '#EF4444',
			showCancel: true,
			onConfirm: async () => {
				try {
					const devicesJson = await AsyncStorage.getItem('devices');
					if (devicesJson) {
						const savedDevices = JSON.parse(devicesJson);
						const updatedDevices = savedDevices.filter(
							(d: any) => d.id !== deviceId
						);
						await AsyncStorage.setItem(
							'devices',
							JSON.stringify(updatedDevices)
						);
						setAlertVisible(false);
						setTimeout(() => router.back(), 0);
					}
				} catch (err) {
					setAlertConfig({
						title: t('error'),
						message: t('device-detail-alert-delete-device-failed'),
						primaryColor: '#EF4444',
						confirmText: t('confirm'),
						showCancel: false,
						onConfirm: () => setAlertVisible(false),
					});
					console.error('Delete device error:', err);
				}
			},
			onCancel: () => setAlertVisible(false),
		});
		setAlertVisible(true);
	};

	if (loading || !device) {
		return null;
	}

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={device.name} showBack={true} />
			<View className="flex-1 bg-white dark:bg-black">
				{/* Device Card */}
				<View className="p-4">
					<View
						className="mb-6 items-center justify-center rounded-2xl p-8"
						style={{
							backgroundColor: device.color,
							height: 200,
						}}
					>
						<Zap size={48} color="white" />
						<Text className="mt-2 text-2xl font-bold text-white">
							{device.name}
						</Text>
						<Text className="text-lg text-white/80">{device.type}</Text>

						{/* Firmware Version */}
						<Pressable
							onPress={() => router.push(`/(device)/ota`)}
							className="mt-3 flex-row items-center gap-1"
						>
							<Package size={14} color="white" strokeWidth={2} />
							<Text className="text-base text-white/80">
								{t('device-detail-ota-version')} v2.5.1
							</Text>
							<ChevronRight size={16} color="white" strokeWidth={2} />
						</Pressable>
					</View>
					<View className="mb-2 flex-row " style={{ gap: 12 }}>
						{/* 电池百分比 */}
						<View style={{ flex: 1 }}>
							<LinearGradient
								colors={
									colorScheme === 'dark'
										? ['#1E3A8A', '#1E40AF']
										: ['#EFF6FF', '#DBEAFE']
								}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									padding: 16,
									borderRadius: 16,
								}}
							>
								<View className="mb-3 flex-row items-center justify-between">
									<Text className="text-xs text-gray-600 dark:text-gray-200">
										{t('device-detail-power')}
									</Text>
									<Battery
										size={18}
										color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'}
										strokeWidth={2}
									/>
								</View>
								<Text className="mb-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
									{device.battery || 0}%
								</Text>
								<View className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
									<View
										className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
										style={{ width: `${device.battery || 0}%` }}
									/>
								</View>
							</LinearGradient>
						</View>

						{/* 充放电状态 */}
						<View style={{ flex: 1 }}>
							<LinearGradient
								colors={
									colorScheme === 'dark'
										? ['#064E3B', '#065F46']
										: ['#F0FDF4', '#DCFCE7']
								}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									padding: 16,
									borderRadius: 16,
								}}
							>
								<View className="mb-3 flex-row items-center justify-between">
									<Text className="text-xs text-gray-600 dark:text-gray-200">
										{t('device-detail-status')}
									</Text>
									<Zap
										size={18}
										color={colorScheme === 'dark' ? '#34D399' : '#10B981'}
										strokeWidth={2}
									/>
								</View>
								<Text className="text-lg font-bold text-green-600 dark:text-green-400">
									{t('device-detail-status-charging')}
								</Text>
								<Text className="mt-1 text-xs text-green-500 dark:text-green-400">
									{t('device-detail-status-time-remaining')} 2 小时
								</Text>
							</LinearGradient>
						</View>

						{/* 定位地图 */}
						<Pressable
							onPress={() =>
								push({
									pathname: '/(device)/map',
									params: { lng: '120.123', lat: '30.456' },
								})
							}
							style={{ flex: 1 }}
						>
							<LinearGradient
								colors={
									colorScheme === 'dark'
										? ['#581C87', '#7C3AED']
										: ['#FAF5FF', '#F3E8FF']
								}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									padding: 16,
									borderRadius: 16,
									flex: 1,
								}}
							>
								<View className="mb-3 flex-row items-center justify-between">
									<Text className="text-xs text-gray-600 dark:text-gray-200">
										{t('device-detail-location')}
									</Text>
									<MapPin
										size={18}
										color={colorScheme === 'dark' ? '#C084FC' : '#A855F7'}
										strokeWidth={2}
									/>
								</View>
								<Text className="mb-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
									深圳市南山区
								</Text>
								<View className="flex-row items-center">
									<Text className="text-xs text-purple-500 dark:text-purple-400">
										{t('device-detail-location-map')}
									</Text>
									<ChevronRight
										size={14}
										color={colorScheme === 'dark' ? '#C084FC' : '#A855F7'}
										strokeWidth={2}
									/>
								</View>
							</LinearGradient>
						</Pressable>
					</View>
				</View>

				<View className="px-4">
					<View className="mb-2 flex-row items-center justify-between">
						<Text className="text-2xl font-bold text-black dark:text-white">
							{t('device-detail-info-title')}
						</Text>
						<Pressable
							onPress={() => setSettingsModalVisible(true)}
							className="rounded-full bg-gray-100 p-2 dark:bg-gray-800"
						>
							<ArrowDownUp
								size={20}
								color={colorScheme === 'dark' ? 'white' : 'black'}
							/>
						</Pressable>
					</View>
				</View>

				{/* Details Section */}
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					style={{ paddingBottom: insets.bottom }}
				>
					<View className="p-4">
						{itemOrder.map((key) => renderDetailItem(key))}
					</View>
				</ScrollView>

				{/* Action Buttons */}
				<DeviceActionButtons
					primaryButton={{
						label: t('device-detail-action-delete'),
						backgroundColor: 'bg-gray-400 dark:bg-gray-800',
						onPress: handleRemoveDevice,
					}}
					showSecondary={false}
				/>
			</View>

			<CustomAlert
				visible={alertVisible}
				title={alertConfig.title}
				message={alertConfig.message}
				primaryColor={alertConfig.primaryColor || '#007AFF'}
				confirmText={alertConfig.confirmText || t('confirm')}
				cancelText={alertConfig.cancelText || t('cancel')}
				showCancel={alertConfig.showCancel !== false}
				onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
				onCancel={() => setAlertVisible(false)}
			/>

			<BottomModal
				visible={settingsModalVisible}
				onClose={() => setSettingsModalVisible(false)}
				title={t('device-detail-settings-sort')}
			>
				<View className="gap-3 pb-6">
					<Text className="mb-2 text-sm text-gray-500 dark:text-gray-400">
						{t('device-detail-settings-description')}
					</Text>

					{itemOrder.map((key, index) => {
						const labels = {
							capacity: t('device-detail-info-capacity'),
							batteryHealth: t('device-detail-info-battery-health'),
							voltage: t('device-detail-info-output-voltage'),
							temperature: t('device-detail-info-current-temperature'),
							usageTime: t('device-detail-info-usage-time'),
							lastCharged: t('device-detail-info-last-charged'),
						};

						const isFirst = index === 0;
						const isLast = index === itemOrder.length - 1;

						return (
							<View
								key={key}
								className="flex-row items-center justify-between rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/80"
							>
								<View className="flex-row items-center gap-3">
									<Text className="w-4 text-sm font-bold text-gray-400">
										{index + 1}
									</Text>
									<Text className="text-base font-medium text-gray-900 dark:text-white">
										{labels[key as keyof typeof labels]}
									</Text>
								</View>

								{/* 按钮区域 */}
								<View className="flex-row gap-2">
									<Pressable
										onPress={() => {
											if (index > 0) {
												const newOrder = [...itemOrder];
												[newOrder[index], newOrder[index - 1]] = [
													newOrder[index - 1],
													newOrder[index],
												];
												updateItemOrder(newOrder);
											}
										}}
										disabled={isFirst}
										className={`h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-700 ${
											isFirst ? 'opacity-30' : 'active:scale-95'
										}`}
									>
										<ChevronUp
											size={20}
											color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'}
										/>
									</Pressable>

									<Pressable
										onPress={() => {
											if (index < itemOrder.length - 1) {
												const newOrder = [...itemOrder];
												[newOrder[index], newOrder[index + 1]] = [
													newOrder[index + 1],
													newOrder[index],
												];
												updateItemOrder(newOrder);
											}
										}}
										disabled={isLast}
										className={`h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-700 ${
											isLast ? 'opacity-30' : 'active:scale-95'
										}`}
									>
										<ChevronDown
											size={20}
											color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'}
										/>
									</Pressable>
								</View>
							</View>
						);
					})}
				</View>
			</BottomModal>
		</>
	);
}
