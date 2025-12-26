import DeviceActionButtons from '@/components/ui/device-action-buttons';
import TopTitle from '@/components/ui/top-title';
import BleService from '@/lib/ble-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { Bluetooth, Check, Tv, Wifi, X, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Animated,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	PermissionsAndroid,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WifiManager from 'react-native-wifi-reborn';
import CustomAlert from '@/utils/my-alert';

interface BluetoothDevice {
	id: string;
	name: string;
	rssi: number;
	manufacturerData?: string;
}

const deviceTypeCache = new Map<string, React.FC<any>>();
const getRssiInfo = (rssi: number) => {
	if (!rssi || rssi === 0 || rssi === -999)
		return { color: '#6B7280', level: 0 };
	if (rssi >= -50) return { color: '#10B981', level: 4 };
	if (rssi >= -70) return { color: '#3B82F6', level: 3 };
	if (rssi >= -85) return { color: '#F59E0B', level: 2 };
	return { color: '#EF4444', level: 1 };
};

const getDeviceTypeIcon = (
	manufacturerData?: string,
	deviceName?: string,
	deviceId?: string
) => {
	if (deviceId && deviceTypeCache.has(deviceId))
		return deviceTypeCache.get(deviceId)!;
	let type = Bluetooth;
	if (
		deviceName?.toLowerCase().includes('power') ||
		deviceName?.toLowerCase().includes('bank')
	) {
		type = Tv;
	}
	if (deviceId) deviceTypeCache.set(deviceId, type);
	return type;
};

export default function AddDevicePage() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { t } = useTranslation();

	// 动画
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const opacityAnim = useRef(new Animated.Value(1)).current;

	// 状态
	const [isScanning, setIsScanning] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [devices, setDevices] = useState<BluetoothDevice[]>([]);
	const [selectedDevices, setSelectedDevices] = useState<Set<string>>(
		new Set()
	);
	const devicesMapRef = useRef<Map<string, BluetoothDevice>>(new Map());

	// 提示弹窗
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertConfig, setAlertConfig] = useState<any>({});

	// Wi-Fi 模态框
	const [showWifiModal, setShowWifiModal] = useState(false);
	const [isWifiScanning, setIsWifiScanning] = useState(false);
	const [wifiList, setWifiList] = useState<string[]>([]);
	const [ssid, setSsid] = useState('');
	const [password, setPassword] = useState('');

	// 权限检查
	const checkPermissions = async () => {
		if (Platform.OS === 'android' && Platform.Version >= 31) {
			const result = await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
				PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
				PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
			]);
			return Object.values(result).every(
				(res) => res === PermissionsAndroid.RESULTS.GRANTED
			);
		}
		return true;
	};

	// 扫描
	const startScanning = async () => {
		try {
			if (!(await checkPermissions()))
				throw new Error(t('add-device-permission-denied'));
			setDevices([]);
			setSelectedDevices(new Set());
			devicesMapRef.current.clear();
			setIsScanning(true);

			BleService.manager.startDeviceScan(null, null, (error, device) => {
				if (error) return;
				if (device?.name) {
					devicesMapRef.current.set(device.id, {
						id: device.id,
						name: device.name,
						rssi: device.rssi || -999,
						manufacturerData: device.manufacturerData || '',
					});
					setDevices(
						Array.from(devicesMapRef.current.values()).sort(
							(a, b) => b.rssi - a.rssi
						)
					);
				}
			});
			setTimeout(() => {
				if (isScanning) stopScanning();
			}, 30000);
		} catch (err: any) {
			showAlert(t('error'), err.message, '#EF4444');
			setIsScanning(false);
		}
	};

	const stopScanning = async () => {
		await BleService.stopScan();
		setIsScanning(false);
	};

	const handleMainConfirm = async () => {
		if (selectedDevices.size === 0) {
			showAlert(t('tip'), t('add-device-chose-device'));
			return;
		}
		const deviceId = Array.from(selectedDevices)[0];
		setIsConnecting(true);

		try {
			await BleService.stopScan();
			setIsScanning(false);

			console.log(`[Page] 正在连接: ${deviceId}`);
			await BleService.connectAndPrepare(deviceId);

			console.log('[Page] 连接成功，请填写 Wi-Fi 信息');
			loadWifiList();
			setShowWifiModal(true);
			// 注意：此时保持连接，等待用户输入密码
		} catch (err: any) {
			console.error(err);
			await BleService.disconnect();
			showAlert(t('error'), '连接失败: ' + err.message, '#EF4444');
			setIsConnecting(false);
		}
	};

	const submitWifiConfig = async () => {
		setShowWifiModal(false);

		const device = BleService.getConnectedDevice();
		if (!device) {
			setIsConnecting(false);
			showAlert(t('error'), '设备已断开', '#EF4444');
			return;
		}

		try {
			const cmdSSID = `SSID:${ssid}\r\n`; // 第一条：只发账号
			const cmdPASS = `PASS:${password}\r\n`; // 第二条：只发密码

			console.log(`[Page] 准备分步发送:`);
			console.log(`       1. ${cmdSSID.trim()}`);
			console.log(`       2. ${cmdPASS.trim()}`);

			// 2. 获取服务
			const services = await device.services();
			let sentCount = 0;

			// 3. 辅助函数：负责把一条长指令切碎并慢速发送
			//    targetS: 服务UUID, targetC: 特征UUID, data: 完整字符串
			const sendLongCommand = async (
				targetS: string,
				targetC: string,
				data: string
			) => {
				const MAX_CHUNK = 20;
				for (let i = 0; i < data.length; i += MAX_CHUNK) {
					const chunk = data.slice(i, i + MAX_CHUNK);
					// 强制 WithoutResponse + 延时
					await BleService.send(targetS, targetC, chunk, false);
					await new Promise((r) => setTimeout(r, 100)); // 包与包之间停 100ms
				}
			};

			// 4. 遍历接口进行发送
			for (const service of services) {
				const characteristics = await service.characteristics();

				for (const char of characteristics) {
					// 只要是能写的
					if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
						try {
							console.log(
								`[Page] >>> 正在向接口 ${char.uuid.slice(4, 8)} 发送...`
							);

							// --- 第一步：发送 SSID ---
							await sendLongCommand(service.uuid, char.uuid, cmdSSID);
							console.log(`       SSID 发送完毕`);

							// --- 关键：中间休息 500ms ---
							// 让设备有时间解析 SSID 并准备接收密码
							await new Promise((r) => setTimeout(r, 500));

							// --- 第二步：发送 密码 ---
							await sendLongCommand(service.uuid, char.uuid, cmdPASS);
							console.log(`       密码 发送完毕`);

							sentCount++;
						} catch (writeErr) {
							console.warn(`[Page] 写入失败: ${writeErr}`);
						}
					}
				}
			}

			if (sentCount === 0) {
				throw new Error('未找到任何可写入的接口');
			}

			console.log(`[Page] 流程结束，指令已分两次发出`);

			// 5. 保存并断开 (延时 2秒，给设备联网时间)
			setTimeout(async () => {
				const existing = await AsyncStorage.getItem('devices');
				const list = existing ? JSON.parse(existing) : [];
				if (!list.some((d: any) => d.id === device.id)) {
					const currentItem = devices.find((d) => d.id === device.id);
					await AsyncStorage.setItem(
						'devices',
						JSON.stringify([
							...list,
							{
								id: device.id,
								name: device.name || currentItem?.name || 'Unknown',
								manufacturerData: currentItem?.manufacturerData,
								addedAt: new Date().toISOString(),
							},
						])
					);
				}

				showAlert(
					t('success'),
					t('add-device-add-success'),
					'#10B981',
					async () => {
						await BleService.disconnect();
						router.back();
					}
				);
			}, 2000);
		} catch (err: any) {
			showAlert(t('error'), '配置失败: ' + err.message, '#EF4444');
			await BleService.disconnect();
			setIsConnecting(false);
		}
	};
	// 其他辅助逻辑
	const loadWifiList = async () => {
		setWifiList([]);
		if (Platform.OS === 'android') {
			setIsWifiScanning(true);
			try {
				const granted = await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
				);
				if (granted === PermissionsAndroid.RESULTS.GRANTED) {
					const list = await WifiManager.reScanAndLoadWifiList();
					const ssids = Array.from(
						new Set(list.map((w: any) => w.SSID).filter(Boolean))
					);
					setWifiList(ssids as string[]);
				}
			} catch (e) {
				console.warn(e);
			} finally {
				setIsWifiScanning(false);
			}
		}
	};

	const cancelWifiConfig = async () => {
		setShowWifiModal(false);
		setIsConnecting(false);
		await BleService.disconnect();
	};

	const showAlert = (
		title: string,
		message: string,
		color?: string,
		onConfirm?: () => void
	) => {
		setAlertConfig({
			title,
			message,
			primaryColor: color,
			onConfirm: () => {
				setAlertVisible(false);
				onConfirm?.();
			},
			showCancel: false,
		});
		setAlertVisible(true);
	};

	useEffect(() => {
		if (isScanning) {
			const anim = Animated.loop(
				Animated.sequence([
					Animated.parallel([
						Animated.timing(scaleAnim, {
							toValue: 1.8,
							duration: 1500,
							useNativeDriver: false,
						}),
						Animated.timing(opacityAnim, {
							toValue: 0,
							duration: 1500,
							useNativeDriver: false,
						}),
					]),
					Animated.parallel([
						Animated.timing(scaleAnim, {
							toValue: 1,
							duration: 0,
							useNativeDriver: false,
						}),
						Animated.timing(opacityAnim, {
							toValue: 1,
							duration: 0,
							useNativeDriver: false,
						}),
					]),
				])
			);
			anim.start();
			return () => anim.stop();
		}
	}, [isScanning, opacityAnim, scaleAnim]);

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={t('add-device-header-title')} showBack={true} />

			{/* --- Wi-Fi 弹窗 --- */}
			<Modal
				visible={showWifiModal}
				transparent={true}
				animationType="slide"
				onRequestClose={cancelWifiConfig}
			>
				<View className="flex-1 justify-end bg-black/50">
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					>
						<View className="rounded-t-3xl bg-white p-6 pb-10 dark:bg-gray-900">
							<View className="mb-4 flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<Wifi size={24} className="text-blue-600" />
									<Text className="text-xl font-bold text-gray-900 dark:text-white">
										{t('choose-wifi')}
									</Text>
								</View>
								<TouchableOpacity onPress={cancelWifiConfig} className="p-2">
									<X size={24} className="text-gray-400" />
								</TouchableOpacity>
							</View>

							<View className="mb-4">
								<View className="mb-2 flex-row items-center justify-between">
									<Text className="text-sm font-semibold text-gray-500">
										AVAILABLE NETWORKS
									</Text>
									{isWifiScanning ? (
										<ActivityIndicator size="small" color="#3B82F6" />
									) : (
										<TouchableOpacity onPress={loadWifiList}>
											<RefreshCw size={14} className="text-blue-500" />
										</TouchableOpacity>
									)}
								</View>
								<View className="h-40 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
									<ScrollView
										nestedScrollEnabled
										keyboardShouldPersistTaps="handled"
									>
										{wifiList.map((item, idx) => (
											<TouchableOpacity
												key={idx}
												onPress={() => setSsid(item)}
												className={`flex-row items-center justify-between border-b border-gray-100 p-3 ${ssid === item ? 'bg-blue-100/50 dark:bg-blue-900/20' : ''}`}
											>
												<Text className="text-sm text-gray-800 dark:text-gray-200">
													{item}
												</Text>
												{ssid === item && <Check size={16} color="#2563EB" />}
											</TouchableOpacity>
										))}
									</ScrollView>
								</View>
							</View>

							<TextInput
								value={ssid}
								onChangeText={setSsid}
								placeholder="SSID"
								className="mb-4 rounded-xl border border-gray-200 bg-white p-3 text-base dark:border-gray-700 dark:bg-gray-800 dark:text-white"
							/>
							<TextInput
								value={password}
								onChangeText={setPassword}
								placeholder="Password"
								secureTextEntry
								className="mb-6 rounded-xl border border-gray-200 bg-white p-3 text-base dark:border-gray-700 dark:bg-gray-800 dark:text-white"
							/>

							<TouchableOpacity
								onPress={submitWifiConfig}
								disabled={!ssid}
								className={`items-center rounded-xl p-4 ${ssid ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
							>
								<Text className="font-bold text-white">Send Configuration</Text>
							</TouchableOpacity>
						</View>
					</KeyboardAvoidingView>
				</View>
			</Modal>

			{/* --- 主界面 --- */}
			<View className="flex-1 bg-gray-100 py-4 dark:bg-black">
				<View
					className="items-center justify-center"
					style={{ marginTop: insets.top, height: 280 }}
				>
					<Animated.View
						style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}
						className="absolute h-[200px] w-[200px] rounded-full bg-yellow-400"
					/>
					<View className="h-40 w-40 items-center justify-center rounded-full bg-yellow-300 dark:bg-yellow-400">
						<Bluetooth size={60} color="white" strokeWidth={1.5} />
					</View>
				</View>
				<View className="flex-1">
					<Text className="mb-2 px-4 text-center text-2xl font-bold text-black dark:text-white">
						{isScanning
							? t('add-device-scan-loading')
							: t('add-device-readying-scan')}
					</Text>
					<FlatList
						data={devices}
						keyExtractor={(item) => item.id}
						numColumns={2}
						columnWrapperStyle={{
							justifyContent: 'space-between',
							marginBottom: 12,
							gap: 12,
						}}
						className="px-4"
						renderItem={({ item }) => {
							const rssi = getRssiInfo(item.rssi);
							const Icon = getDeviceTypeIcon(
								item.manufacturerData,
								item.name,
								item.id
							);
							const isSelected = selectedDevices.has(item.id);
							return (
								<Pressable
									onPress={() => {
										const set = new Set(selectedDevices);
										set.has(item.id)
											? set.delete(item.id)
											: (set.clear(), set.add(item.id));
										setSelectedDevices(set);
									}}
									className={`w-[48%] overflow-hidden rounded-2xl border-2 p-[14px] ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'}`}
								>
									<View className="mb-3 flex-row items-center justify-between">
										<View
											className={`h-7 w-7 items-center justify-center rounded-full border-2 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
										>
											{isSelected && (
												<Check size={16} color="white" strokeWidth={3} />
											)}
										</View>
										<View
											className="h-10 w-10 items-center justify-center rounded-lg"
											style={{ backgroundColor: `${rssi.color}20` }}
										>
											<Icon size={20} color={rssi.color} strokeWidth={2} />
										</View>
									</View>
									<Text
										className="mb-2 text-sm font-semibold text-black dark:text-white"
										numberOfLines={1}
									>
										{item.name}
									</Text>
								</Pressable>
							);
						}}
					/>
				</View>
			</View>

			<CustomAlert
				visible={alertVisible}
				{...alertConfig}
				onCancel={() => setAlertVisible(false)}
			/>

			<DeviceActionButtons
				primaryButton={{
					label: isScanning
						? t('add-device-action-stop-scan')
						: t('add-device-action-start-scan'),
					backgroundColor: 'bg-blue-500 dark:bg-blue-600',
					onPress: () => (isScanning ? stopScanning() : startScanning()),
				}}
				secondaryButton={{
					label: isConnecting
						? 'Processing...'
						: t('add-device-action-confirm'),
					backgroundColor: isConnecting
						? 'bg-gray-400'
						: 'bg-green-500 dark:bg-green-600',
					onPress: handleMainConfirm,
				}}
				showSecondary={selectedDevices.size > 0}
			/>
		</>
	);
}
