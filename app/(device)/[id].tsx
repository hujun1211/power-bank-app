import BottomModal from '@/components/ui/bottom-modal';
import DeviceActionButtons from '@/components/ui/device-action-buttons';
import CustomAlert from '@/components/ui/system-alert';
import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import BleService from '@/lib/ble-service';
import {
	canOpenBleDebugForDevice,
	getDeviceDetailConnectionLabel,
	type DeviceDetailConnectionStatus,
	shouldAutoConnectDetailDevice,
	shouldShowManualConnectButton,
} from '@/utils/device-detail-ble';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
	Battery,
	BatteryPlus,
	Clock,
	Droplet,
	GripVertical,
	Plug,
	Thermometer,
	Zap,
} from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
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

const defaultDeviceDetails: Record<string, DeviceDetail> = {
	'demo-device-1': {
		id: 'demo-device-1',
		name: 'PowerBank Pro',
		type: 'PB-100',
		color: '#3B82F6',
		capacity: '20000mAh',
		battery: 73,
		voltage: '5V/2A',
		batteryHealth: '95%',
		temperature: '25°C',
		usageTime: '2小时',
		lastCharged: '2小时前',
	},
};

interface DetailItemProps {
	icon: React.ReactNode;
	label: string;
	value: string;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
	const colorScheme = useColorScheme();

	const gradientColors = useMemo(
		(): [string, string] =>
			colorScheme === 'dark' ? ['#374151', '#374151'] : ['#F3F4F6', '#F3F4F6'],
		[colorScheme]
	);

	return (
		<LinearGradient
			colors={gradientColors}
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

const MemoizedDetailItem = memo(DetailItem);

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
	const [shouldAutoConnect, setShouldAutoConnect] = useState(false);
	const [connectionStatus, setConnectionStatus] =
		useState<DeviceDetailConnectionStatus>('idle');
	const [connectionAttemptKey, setConnectionAttemptKey] = useState(0);

	// 默认顺序
	const [itemOrder, setItemOrder] = useState([
		'capacity',
		'batteryHealth',
		'voltage',
		// 'temperature',
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
	const updateItemOrder = (newOrder: string[]) => {
		setItemOrder(newOrder); // 立即更新 UI
		// 异步保存到存储
		AsyncStorage.setItem(
			STORAGE_KEY_SORT_ORDER,
			JSON.stringify(newOrder)
		).catch((error) => {
			console.error('Failed to save sort order:', error);
		});
	};

	const loadDevice = useCallback(async () => {
		try {
			setShouldAutoConnect(false);
			setConnectionStatus('idle');
			const devicesJson = await AsyncStorage.getItem('devices');
			if (devicesJson) {
				const savedDevices = JSON.parse(devicesJson);
				const foundDevice = savedDevices.find((d: any) => d.id === deviceId);
				if (foundDevice) {
					setShouldAutoConnect(true);
					const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
					const colorIndex = savedDevices.indexOf(foundDevice);
					setDevice({
						...foundDevice,
						color: colors[colorIndex % 4],
						battery: 73,
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
	}, [deviceId]);

	useEffect(() => {
		void loadDevice();
	}, [loadDevice]);

	useEffect(() => {
		let cancelled = false;

		const connectCurrentDevice = async () => {
			if (loading || !shouldAutoConnect) {
				return;
			}

			const currentConnected = BleService.getConnectedDevice();
			if (
				!shouldAutoConnectDetailDevice(deviceId, currentConnected?.id ?? null)
			) {
				if (!cancelled) {
					setConnectionStatus('connected');
				}
				return;
			}

			if (!cancelled) {
				setConnectionStatus('connecting');
			}

			try {
				if (currentConnected && currentConnected.id !== deviceId) {
					await BleService.disconnect();
				}

				const connectedDevice = await BleService.connectAndPrepare(deviceId);

				if (!cancelled) {
					setConnectionStatus(
						connectedDevice.id === deviceId ? 'connected' : 'failed'
					);
				}
			} catch (error) {
				console.error('Auto connect device error:', error);
				if (!cancelled) {
					setConnectionStatus('failed');
				}
			}
		};

		void connectCurrentDevice();

		return () => {
			cancelled = true;
		};
	}, [connectionAttemptKey, deviceId, loading, shouldAutoConnect]);

	const detailItems = useMemo(
		() => ({
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
			// temperature: {
			// 	icon: (
			// 		<Thermometer
			// 			size={20}
			// 			color={colorScheme === 'dark' ? 'white' : 'black'}
			// 		/>
			// 	),
			// 	label: t('device-detail-info-current-temperature'),
			// 	value: device?.temperature || t('unknown'),
			// },
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
		}),
		[t, colorScheme, device]
	);

	// 页面当前未渲染详情拖拽列表，保留该渲染函数以便后续恢复。
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const renderDetailItem = (key: string) => {
		const item = detailItems[key as keyof typeof detailItems];
		if (!item) return null;
		return <MemoizedDetailItem key={key} {...item} />;
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
			<TopTitle title="设备详情" showBack={true} />
			<View className="flex-1 bg-white dark:bg-black">
				<View className="mx-4 mt-4 flex-row items-center justify-between rounded-2xl bg-gray-100 p-5">
					<View className="mr-4 flex-1">
						<Text
							className="text-3xl font-bold text-[#696969]"
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{device.name}
						</Text>
						<Text className="mt-1 text-sm text-gray-400">
							{getDeviceDetailConnectionLabel(connectionStatus)}
						</Text>
					</View>

					{shouldShowManualConnectButton(connectionStatus) && (
						<TouchableOpacity
							onPress={() => setConnectionAttemptKey((prev) => prev + 1)}
							className="rounded-full bg-blue-500 px-4 py-2"
							activeOpacity={0.8}
						>
							<Text className="text-sm font-semibold text-white">连接蓝牙</Text>
						</TouchableOpacity>
					)}
				</View>
				<View className="p-4">
					<View className="flex-row flex-wrap" style={{ gap: 12 }}>
						<View style={{ flex: 1, minWidth: '45%', height: 140 }}>
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
									height: '100%',
									justifyContent: 'space-between',
								}}
							>
								<View className="mb-3 flex-row items-center justify-between">
									<Text
										numberOfLines={1}
										ellipsizeMode="tail"
										className="text-sm text-gray-600 dark:text-gray-200"
									>
										{t('device-detail-power')}
									</Text>
									<Battery
										size={18}
										color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'}
										strokeWidth={2}
									/>
								</View>
								<View>
									<Text className="mb-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
										{device.battery || 0}%
									</Text>
									<View className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
										<View
											className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
											style={{ width: `${device.battery || 0}%` }}
										/>
									</View>
								</View>
							</LinearGradient>
						</View>

						<View style={{ flex: 1, minWidth: '45%', height: 140 }}>
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
									height: '100%',
									justifyContent: 'space-between',
								}}
							>
								<View className="mb-3 flex-row items-center justify-between">
									<Text
										numberOfLines={1}
										ellipsizeMode="tail"
										className="text-sm text-gray-600 dark:text-gray-200"
									>
										{t('device-detail-charge-discharge-power')}
									</Text>
									<Zap
										size={18}
										color={colorScheme === 'dark' ? '#34D399' : '#10B981'}
										strokeWidth={2}
									/>
								</View>
								<View className="flex flex-row items-end gap-1">
									<Text className="text-3xl font-bold text-green-600 dark:text-green-400">
										35
									</Text>
									<Text className="text-lg font-bold text-green-500 dark:text-green-400">
										{t('device-detail-charge-discharge-power-status')}
									</Text>
								</View>
								{/* <Text
									numberOfLines={1}
									ellipsizeMode="tail"
									className="mt-1 text-xs text-green-500 dark:text-green-400"
								>
									{t('device-detail-charge-discharge-power-time-remaining')}
								</Text> */}
							</LinearGradient>
						</View>

						<View style={{ flex: 1, minWidth: '45%', height: 140 }}>
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
									height: '100%',
									justifyContent: 'space-between',
								}}
							>
								<View className="mb-3 flex-row items-center justify-between">
									<Text
										numberOfLines={1}
										ellipsizeMode="tail"
										className="text-sm text-gray-600 dark:text-gray-200"
									>
										{t('device-detail-charges-number')}
									</Text>
									<Plug
										size={18}
										color={colorScheme === 'dark' ? '#C084FC' : '#A855F7'}
										strokeWidth={2}
									/>
								</View>
								<View className="flex flex-row items-end gap-1">
									<Text className="text-3xl font-bold text-purple-600 dark:text-purple-400">
										9
									</Text>
									<Text className="text-lg font-bold text-purple-500 dark:text-purple-400">
										{t('device-detail-charges-number-status')}
									</Text>
								</View>
							</LinearGradient>
						</View>

						<View style={{ flex: 1, minWidth: '45%', height: 140 }}>
							<LinearGradient
								colors={
									colorScheme === 'dark'
										? ['#BBFAFC', '#E7FDFE']
										: ['#BBFAFC', '#E7FDFE']
								}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									padding: 16,
									borderRadius: 16,
									height: '100%',
									justifyContent: 'space-between',
								}}
							>
								<View className="mb-3 flex-row items-center justify-between">
									<Text
										numberOfLines={1}
										ellipsizeMode="tail"
										className="text-sm text-gray-600 dark:text-gray-200"
									>
										{t('device-detail-temp')}
									</Text>
									<Thermometer
										size={18}
										color={colorScheme === 'dark' ? '#BBFAFC' : '#09C1C8'}
										strokeWidth={2}
									/>
								</View>
								<View className="flex flex-row items-end gap-1">
									<Text className="text-3xl font-bold text-sky-500 dark:text-sky-400">
										28.5
									</Text>
									<Text className="text-lg font-bold text-sky-600 dark:text-sky-400">
										{t('device-detail-temp-status')}
									</Text>
								</View>
							</LinearGradient>
						</View>
					</View>
				</View>

				{/* <View className="mx-4 mb-4 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
					<GMapView />
					<View className="absolute left-3 right-3 top-3 flex-row items-center justify-between">
						<View className="rounded-lg bg-white/90 px-3 py-1.5 dark:bg-black/70">
							<Text className="text-sm font-semibold text-gray-800 dark:text-gray-100">
								设备位置
							</Text>
						</View>
						<TouchableOpacity
							onPress={() => {}}
							className="h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-black/70"
							activeOpacity={0.7}
						>
							<RotateCcw
								size={16}
								color={colorScheme === 'dark' ? '#F3F4F6' : '#374151'}
							/>
						</TouchableOpacity>
					</View>
				</View> */}

				{/* <View className="px-4">
					<View className="mb-1 flex-row items-center justify-between ">
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
				</View> */}

				{/* <ScrollView
					className="flex-1 "
					showsVerticalScrollIndicator={false}
					style={{ paddingBottom: insets.bottom }}
				>
					<View className="p-4 ">
						{itemOrder.map((key) => renderDetailItem(key))}
					</View>
				</ScrollView> */}
			</View>

			<DeviceActionButtons
				primaryButton={{
					label: t('device-detail-action-delete'),
					backgroundColor: 'bg-gray-400 dark:bg-gray-800',
					onPress: handleRemoveDevice,
				}}
				secondaryButton={{
					label: 'BLE 调试',
					backgroundColor: 'bg-blue-600 dark:bg-blue-700',
					onPress: () =>
						push({
							pathname: '/(device)/ble-debug',
							params: {
								id: device.id,
								name: device.name,
							},
						}),
					disabled: !canOpenBleDebugForDevice(connectionStatus),
				}}
				showSecondary={true}
			/>

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
				<View
					className="pb-6"
					style={{ height: 530, paddingBottom: insets.bottom + 16 }}
				>
					<Text className="mb-4 text-sm text-gray-500 dark:text-gray-400">
						{t('device-detail-settings-description')}
					</Text>

					<DraggableFlatList
						data={itemOrder}
						onDragEnd={({ data }) => updateItemOrder(data)}
						onDragBegin={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						}}
						keyExtractor={(item) => item}
						showsVerticalScrollIndicator={false}
						dragHitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						renderItem={({ item: key, drag, isActive, getIndex }) => {
							const labels = {
								capacity: t('device-detail-info-capacity'),
								batteryHealth: t('device-detail-info-battery-health'),
								voltage: t('device-detail-info-output-voltage'),
								temperature: t('device-detail-info-current-temperature'),
								usageTime: t('device-detail-info-usage-time'),
								lastCharged: t('device-detail-info-last-charged'),
							};

							const index = getIndex() ?? 0;

							return (
								<Pressable
									onLongPress={drag}
									disabled={isActive}
									className={`mb-3 flex-row items-center justify-between rounded-2xl p-4 ${
										isActive
											? 'bg-blue-50 dark:bg-blue-900/30'
											: 'bg-gray-50 dark:bg-gray-800/80'
									}`}
								>
									<View className="flex-row items-center gap-3">
										<Text className="w-4 text-sm font-bold text-gray-400">
											{index + 1}
										</Text>
										<Text className="text-base font-medium text-gray-900 dark:text-white">
											{labels[key as keyof typeof labels]}
										</Text>
									</View>

									<View className="h-10 w-10 items-center justify-center">
										<GripVertical
											size={20}
											color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
										/>
									</View>
								</Pressable>
							);
						}}
					/>
				</View>
			</BottomModal>
		</>
	);
}
