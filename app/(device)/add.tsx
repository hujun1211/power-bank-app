import BottomModal from '@/components/ui/bottom-modal';
import DeviceActionButtons from '@/components/ui/device-action-buttons';
import CustomAlert from '@/components/ui/system-alert';
import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import BleService, { BleError, BleErrorType } from '@/lib/ble-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { Stack, useRouter } from 'expo-router';
import {
	Bluetooth,
	Check,
	RefreshCw,
	SearchX,
	Signal,
	SignalHigh,
	SignalLow,
	Tv,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Animated,
	FlatList,
	PermissionsAndroid,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WifiManager from 'react-native-wifi-reborn';

interface BluetoothDevice {
	id: string;
	name: string;
	rssi: number;
	manufacturerData?: string;
}

const deviceTypeCache = new Map<string, React.FC<any>>();

const getRssiInfo = (rssi: number) => {
	if (!rssi || rssi === 0 || rssi === -999)
		return { color: '#6B7280', level: 0, icon: SignalLow };
	if (rssi >= -50) return { color: '#10B981', level: 4, icon: SignalHigh };
	if (rssi >= -70) return { color: '#3B82F6', level: 3, icon: Signal };
	if (rssi >= -85) return { color: '#F59E0B', level: 2, icon: Signal };
	return { color: '#EF4444', level: 1, icon: SignalLow };
};

const getDeviceTypeIcon = (
	manufacturerData?: string,
	deviceName?: string,
	deviceId?: string
) => {
	if (deviceId && deviceTypeCache.has(deviceId))
		return deviceTypeCache.get(deviceId)!;

	let type = Bluetooth;

	if (manufacturerData) {
		try {
			const buf = Buffer.from(manufacturerData, 'base64');
			if (buf.length >= 8 && buf[7] === 0x1f) {
				type = Tv;
			}
		} catch {
			// ignore
		}
	}

	if (type === Bluetooth && deviceName) {
		const name = deviceName.toLowerCase();
		if (
			name.includes('power') ||
			name.includes('bank') ||
			name.includes('充电') ||
			name.includes('宝')
		) {
			type = Tv;
		}
	}

	if (deviceId) deviceTypeCache.set(deviceId, type);
	return type;
};

export default function AddDevicePage() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { t } = useTranslation();
	const colorScheme = useColorScheme();

	// 动画
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const opacityAnim = useRef(new Animated.Value(1)).current;
	const connectScaleAnim = useRef(new Animated.Value(1)).current;
	const connectOpacityAnim = useRef(new Animated.Value(0)).current;

	// 页面挂载状态和连接状态跟踪
	const isMountedRef = useRef(true);
	const connectingDeviceIdRef = useRef<string | null>(null);

	// 状态
	const [isScanning, setIsScanning] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [devices, setDevices] = useState<BluetoothDevice[]>([]);
	const [selectedDevices, setSelectedDevices] = useState<Set<string>>(
		new Set()
	);
	const [showNoDevicesMessage, setShowNoDevicesMessage] = useState(false);
	const devicesMapRef = useRef<Map<string, BluetoothDevice>>(new Map());
	const noDevicesTimeoutRef = useRef<number | null>(null);
	const isTimeoutRef = useRef(false);

	// 页面生命周期管理
	useEffect(() => {
		return () => {
			// 页面卸载时标记为未挂载
			isMountedRef.current = false;
			// 如果有正在连接的设备，先取消它
			if (connectingDeviceIdRef.current) {
				BleService.manager
					.cancelDeviceConnection(connectingDeviceIdRef.current)
					.catch(() => {});
			}
			// 如果没有连接成功的设备，才进行全局清理
			// 保持与连接成功设备的通信
			if (!BleService.getConnectedDevice()) {
				BleService.forceCleanup();
			} else {
				// 只清理扫描和监听，但不断开连接成功的设备
				BleService.stopScan().catch(() => {});
				// 注意：这里不清理 monitorSubscriptions，因为可能还在使用
			}
		};
	}, []);

	// 弹窗状态
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertConfig, setAlertConfig] = useState<any>({});
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

	// 扫描逻辑
	const startScanning = async () => {
		try {
			if (!(await checkPermissions())) throw new Error('permission denied');
			setDevices([]);
			setSelectedDevices(new Set());
			devicesMapRef.current.clear();
			setIsScanning(true);
			setShowNoDevicesMessage(false);

			noDevicesTimeoutRef.current = setTimeout(() => {
				if (devicesMapRef.current.size === 0) {
					setShowNoDevicesMessage(true);
				}
			}, 5000);

			BleService.manager.startDeviceScan(null, null, (error, device) => {
				if (error) return;
				if (device?.name) {
					devicesMapRef.current.set(device.id, {
						id: device.id,
						name: device.name,
						rssi: device.rssi || -999,
						manufacturerData: device.manufacturerData || '',
					});
					setDevices(Array.from(devicesMapRef.current.values()));
					if (noDevicesTimeoutRef.current) {
						clearTimeout(noDevicesTimeoutRef.current);
						noDevicesTimeoutRef.current = null;
					}
					setShowNoDevicesMessage(false);
				}
			});
			setTimeout(() => {
				if (isScanning) stopScanning();
			}, 30000);
		} catch (err: any) {
			const errorResult = getBleErrorMessage(err, false);
			showAlert(
				t('error'),
				errorResult.message,
				'#EF4444',
				undefined,
				errorResult.tip
			);
			setIsScanning(false);
		}
	};

	const stopScanning = async () => {
		await BleService.stopScan();
		setIsScanning(false);
		if (noDevicesTimeoutRef.current) {
			clearTimeout(noDevicesTimeoutRef.current);
			noDevicesTimeoutRef.current = null;
		}
		setShowNoDevicesMessage(false);
	};

	const handleMainConfirm = async () => {
		// 如果正在连接，不允许中断连接
		if (isConnecting && connectingDeviceIdRef.current) {
			return;
		}

		if (selectedDevices.size === 0) {
			showAlert(t('tip'), t('add-device-chose-device'));
			return;
		}
		const deviceId = Array.from(selectedDevices)[0];

		setIsConnecting(true);
		isTimeoutRef.current = false;
		connectingDeviceIdRef.current = deviceId; // 记录正在连接的设备

		// 建立一个包装函数，确保所有 Reject 都能被 catch 到
		const runConnection = async () => {
			try {
				await BleService.stopScan();
				setIsScanning(false);
				console.log(`[Page] 正在连接: ${deviceId}`);

				// 使用超时逻辑
				const connectPromise = BleService.connectAndPrepare(deviceId);
				let timeoutId: ReturnType<typeof setTimeout>;
				const timeoutPromise = new Promise<never>((_, reject) => {
					timeoutId = setTimeout(async () => {
						if (!isMountedRef.current) return; // 如果页面已关，不再处理

						isTimeoutRef.current = true;
						console.log('[Page] 连接超时，开始强制断开连接...');
						// 强制 Native 中断连接请求
						await BleService.manager
							.cancelDeviceConnection(deviceId)
							.catch(() => {});
						reject(
							new BleError(
								BleErrorType.CONNECTION_TIMEOUT,
								t('add-device-ble-timeout')
							)
						);
					}, 20000);
				});

				// 执行竞速，无论输赢都清除定时器
				await Promise.race([connectPromise, timeoutPromise]).finally(() => {
					if (timeoutId) clearTimeout(timeoutId);
				});

				// 检查页面是否还存在
				if (!isMountedRef.current) {
					await BleService.disconnect();
					return;
				}

				console.log('[Page] 连接成功，请填写 Wi-Fi 信息');
				loadWifiList();
				setShowWifiModal(true);
			} catch (err: any) {
				// 在这里拦截所有异常
				// 只有在页面已卸载的情况下才拦截所有错误
				if (!isMountedRef.current) {
					console.log('[Page] 页面已卸载，拦截所有错误');
					return;
				}

				// 对于挂载的页面，只有用户主动取消的错误才拦截
				if (err?.type === BleErrorType.OPERATION_CANCELLED) {
					console.log('[Page] 用户主动取消连接，安全返回');
					return;
				}

				// console.error('连接错误:', err);
				const errorResult = getBleErrorMessage(err, isTimeoutRef.current);
				showAlert(
					t('error'),
					errorResult.message,
					'#EF4444',
					undefined,
					errorResult.tip
				);
			} finally {
				if (isMountedRef.current) {
					setIsConnecting(false);
					connectingDeviceIdRef.current = null;
				}
			}
		};

		// 执行连接
		runConnection();
	};

	// 发送配置
	const submitWifiConfig = async () => {
		setShowWifiModal(false);
		const device = BleService.getConnectedDevice();
		if (!device) {
			setIsConnecting(false);
			showAlert(
				t('error'),
				t('add-device-ble-disconnected'),
				'#EF4444',
				undefined,
				t('add-device-ble-disconnected-tip')
			);
			return;
		}

		try {
			const cmdSSID = `SSID:${ssid}\r\n`;
			const cmdPASS = `PASS:${password}\r\n`;

			const services = await device.services();
			let sentCount = 0;

			const sendLongCommand = async (
				targetS: string,
				targetC: string,
				data: string
			) => {
				const MAX_CHUNK = 20;
				for (let i = 0; i < data.length; i += MAX_CHUNK) {
					const chunk = data.slice(i, i + MAX_CHUNK);
					await BleService.send(targetS, targetC, chunk, false);
					await new Promise((r) => setTimeout(r, 100));
				}
			};

			for (const service of services) {
				const characteristics = await service.characteristics();
				for (const char of characteristics) {
					if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
						try {
							await sendLongCommand(service.uuid, char.uuid, cmdSSID);
							await new Promise((r) => setTimeout(r, 500));
							await sendLongCommand(service.uuid, char.uuid, cmdPASS);
							sentCount++;
						} catch (writeErr) {
							console.warn(`[Page] 写入失败: ${writeErr}`);
						}
					}
				}
			}

			if (sentCount === 0) throw new Error('未找到任何可写入的接口');

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
					t('add-device-add-success', { deviceName: device.name || device.id }),
					'#10B981',
					async () => {
						await BleService.disconnect();
						router.back();
					}
				);
			}, 2000);
		} catch (err: any) {
			showAlert(
				t('error'),
				'Error: ' + err.message,
				'#EF4444',
				undefined,
				t('add-device-wifi-tip')
			);
			await BleService.disconnect();
			setIsConnecting(false);
		}
	};

	// Wi-Fi 列表
	const loadWifiList = async () => {
		if (Platform.OS === 'android') {
			setIsWifiScanning(true);
			try {
				const granted = await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
				);
				if (granted === PermissionsAndroid.RESULTS.GRANTED) {
					const result = await WifiManager.reScanAndLoadWifiList();
					if (Array.isArray(result)) {
						const ssids = result
							.map((w: any) => w.SSID)
							.filter((ssid) => ssid && ssid.length > 0);
						setWifiList(Array.from(new Set(ssids)));
					}
				}
			} catch (e) {
				console.warn('[Wi-Fi] 异常:', e);
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

	const getBleErrorMessage = (
		err: any,
		isTimeout: boolean
	): { message: string; tip: string } => {
		let result: { message: string; tip: string };
		if (err instanceof BleError) {
			switch (err.type) {
				case BleErrorType.CONNECTION_TIMEOUT:
					result = {
						message: t('add-device-ble-timeout'),
						tip: t('add-device-ble-timeout-tip'),
					};
					break;
				case BleErrorType.DEVICE_DISCONNECTED:
					result = {
						message: t('add-device-ble-disconnected'),
						tip: t('add-device-ble-disconnected-tip'),
					};
					break;
				case BleErrorType.PERMISSION_DENIED:
					result = {
						message: t('add-device-ble-permission-denied'),
						tip: t('add-device-ble-permission-denied-tip'),
					};
					break;
				case BleErrorType.BLUETOOTH_DISABLED:
					result = {
						message: t('add-device-ble-bluetooth-disabled'),
						tip: t('add-device-ble-bluetooth-disabled-tip'),
					};
					break;
				case BleErrorType.DEVICE_NOT_FOUND:
					result = {
						message: t('add-device-ble-device-not-found'),
						tip: t('add-device-ble-device-not-found-tip'),
					};
					break;
				case BleErrorType.CONNECTION_FAILED:
					result = {
						message: t('add-device-ble-connection-failed'),
						tip: t('add-device-ble-connection-failed-tip'),
					};
					break;
				case BleErrorType.SERVICE_NOT_FOUND:
					result = {
						message: t('add-device-ble-service-not-found'),
						tip: t('add-device-ble-service-not-found-tip'),
					};
					break;
				case BleErrorType.CHARACTERISTIC_NOT_FOUND:
					result = {
						message: t('add-device-ble-characteristic-not-found'),
						tip: t('add-device-ble-characteristic-not-found-tip'),
					};
					break;
				case BleErrorType.WRITE_FAILED:
					result = {
						message: t('add-device-ble-write-failed'),
						tip: t('add-device-ble-write-failed-tip'),
					};
					break;
				case BleErrorType.READ_FAILED:
					result = {
						message: t('add-device-ble-read-failed'),
						tip: t('add-device-ble-read-failed-tip'),
					};
					break;
				case BleErrorType.SCAN_FAILED:
					result = {
						message: t('add-device-ble-scan-failed'),
						tip: t('add-device-ble-scan-failed-tip'),
					};
					break;
				case BleErrorType.OPERATION_CANCELLED:
					result = {
						message: t('add-device-ble-cancelled'),
						tip: t('add-device-ble-cancelled-tip'),
					};
					break;
				case BleErrorType.SYSTEM_CANCELLATION:
					result = {
						message: t('add-device-ble-system-cancellation'),
						tip: t('add-device-ble-system-cancellation-tip'),
					};
					break;
				case BleErrorType.DEVICE_UNSUPPORTED:
					result = {
						message: t('add-device-ble-device-unsupported'),
						tip: t('add-device-ble-device-unsupported-tip'),
					};
					break;
				default:
					result = {
						message: t('add-device-ble-unknown-error'),
						tip: t('add-device-ble-unknown-error-tip'),
					};
					break;
			}
		} else {
			// 处理非 BleError 的情况
			result = {
				message: t('add-device-ble-unknown-error'),
				tip: t('add-device-ble-unknown-error-tip'),
			};
		}

		// 内部判断：如果 isTimeout 且不是 CONNECTION_TIMEOUT，添加超时提示
		if (isTimeout && err.type !== BleErrorType.CONNECTION_TIMEOUT) {
			result.tip += ' ' + t('add-device-ble-timeout-tip');
		}

		return result;
	};

	const showAlert = (
		title: string,
		message: string | React.ReactNode,
		color?: string,
		onConfirm?: () => void,
		tip?: string | React.ReactNode
	) => {
		setAlertConfig({
			title,
			message,
			tip,
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

	useEffect(() => {
		if (isConnecting) {
			// 蓝色向内汇聚动画
			const connectAnim = Animated.loop(
				Animated.parallel([
					// 1. 缩放动画：从外围 2.5 倍迅速缩小到 1 倍中心点
					Animated.timing(connectScaleAnim, {
						toValue: 0.8, // 稍微缩得比中心圆圈小一点，产生“没入”感
						duration: 1500,
						useNativeDriver: true, // 使用原生驱动更丝滑
					}),
					// 2. 透明度动画：在缩小的过程中，先显现后消失
					Animated.sequence([
						// 刚开始从外围出现
						Animated.timing(connectOpacityAnim, {
							toValue: 0.4,
							duration: 400,
							useNativeDriver: true,
						}),
						// 靠近中心时变淡，模拟“吸收”进去的感觉
						Animated.timing(connectOpacityAnim, {
							toValue: 0,
							duration: 1100,
							useNativeDriver: true,
						}),
					]),
				])
			);

			// 重置初始值
			connectScaleAnim.setValue(2.5);
			connectOpacityAnim.setValue(0);

			connectAnim.start();
			return () => {
				connectAnim.stop();
			};
		}
	}, [connectOpacityAnim, connectScaleAnim, isConnecting]);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			// 页面卸载时，如果正在连接，立即执行断开
			if (connectingDeviceIdRef.current) {
				console.log(
					'[Page] 卸载，中断正在进行的连接:',
					connectingDeviceIdRef.current
				);
				BleService.manager
					.cancelDeviceConnection(connectingDeviceIdRef.current)
					.catch(() => {});
			}
		};
	}, []);

	useEffect(() => {
		return () => {
			(async () => {
				console.log('[Page] 页面退出，执行清理');
				// 1. 如果有记录的正在连接的 ID，先 cancel
				if (connectingDeviceIdRef.current) {
					await BleService.manager
						.cancelDeviceConnection(connectingDeviceIdRef.current)
						.catch(() => {});
				}
				// 2. 执行 Service 全局清理
				await BleService.forceCleanup();
			})();
		};
	}, []);

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={t('add-device-header-title')} showBack={true} />

			<BottomModal
				visible={showWifiModal}
				onClose={cancelWifiConfig}
				title={t('add-device-choose-wifi')}
			>
				<View className="mb-4">
					<View className="mb-2 flex-row items-center justify-between">
						<Text className="text-sm font-semibold text-gray-500">
							{t('add-device-choose-wifi-ssid-list')}
						</Text>
						{isWifiScanning ? (
							<ActivityIndicator size={14} color="#3B82F6" />
						) : (
							<TouchableOpacity onPress={loadWifiList}>
								<RefreshCw size={14} color="#3B82F6" />
							</TouchableOpacity>
						)}
					</View>
					<View className="h-40 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
						<ScrollView nestedScrollEnabled={true}>
							{wifiList.map((item, idx) => (
								<TouchableOpacity
									key={idx}
									onPress={() => setSsid(item)}
									className={`flex-row items-center justify-between p-3 ${
										idx < wifiList.length - 1
											? 'border-b border-gray-100 dark:border-gray-700'
											: ''
									} ${
										ssid === item ? 'bg-blue-100/50 dark:bg-blue-900/20' : ''
									}`}
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
					placeholder={t('add-device-choose-wifi-ssid-placeholder')}
					className="mb-4 rounded-xl border border-gray-200 bg-white p-3 text-base dark:border-gray-700 dark:bg-gray-800 dark:text-white"
				/>
				<TextInput
					value={password}
					onChangeText={setPassword}
					placeholder={t('add-device-choose-wifi-password-placeholder')}
					secureTextEntry
					className="mb-6 rounded-xl border border-gray-200 bg-white p-3 text-base dark:border-gray-700 dark:bg-gray-800 dark:text-white"
				/>
				<TouchableOpacity
					onPress={submitWifiConfig}
					disabled={!ssid}
					className={`items-center rounded-xl p-4 ${
						ssid ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
					}`}
				>
					<Text className="font-bold text-white">
						{t('add-device-choose-wifi-submit')}
					</Text>
				</TouchableOpacity>
				{Platform.OS === 'ios' && <View style={{ height: 20 }} />}
			</BottomModal>

			<View className="flex-1 bg-gray-50 dark:bg-black">
				<View
					className="items-center justify-center pb-4"
					style={{ marginTop: insets.top, zIndex: 1 }}
				>
					<View className="h-[200px] w-full items-center justify-center">
						{isScanning && (
							<Animated.View
								style={{
									transform: [{ scale: scaleAnim }],
									opacity: opacityAnim,
									width: 200,
									height: 200,
									borderRadius: 100,
									backgroundColor: '#FBBF24',
									position: 'absolute',
								}}
							/>
						)}
						{isConnecting && (
							<>
								<Animated.View
									style={{
										transform: [{ scale: connectScaleAnim }],
										opacity: connectOpacityAnim,
										width: 200,
										height: 200,
										borderRadius: 100,
										borderWidth: 2,
										borderColor: '#3B82F6',
										position: 'absolute',
									}}
								/>
								<Animated.View
									style={{
										transform: [{ scale: connectScaleAnim }],
										opacity: Animated.multiply(connectOpacityAnim, 0.3),
										width: 200,
										height: 200,
										borderRadius: 100,
										backgroundColor: '#3B82F6',
										position: 'absolute',
									}}
								/>
							</>
						)}
						<View
							className={`h-40 w-40 items-center justify-center rounded-full shadow-lg ${
								isConnecting ? 'bg-blue-600' : 'bg-yellow-400'
							}`}
							style={{ zIndex: 10 }}
						>
							<Bluetooth size={60} color="white" strokeWidth={1.5} />
						</View>
					</View>
					<Text className="mb-1 px-4 text-center text-2xl font-bold text-black dark:text-white">
						{isConnecting
							? t('add-device-action-connecting')
							: isScanning
								? t('add-device-scan-loading')
								: t('add-device-readying-scan')}
					</Text>
					<Text className="px-8 text-center text-base text-gray-500 dark:text-gray-400">
						{isConnecting
							? t('add-device-connecting-hint')
							: isScanning
								? t('add-device-scan-loading-hint')
								: t('add-device-readying-scan-hint')}
					</Text>
				</View>

				<View className="w-full flex-1 bg-gray-50 dark:bg-black">
					{showNoDevicesMessage ? (
						<View className="flex-1 items-center justify-center pb-20 opacity-50">
							<SearchX
								size={48}
								color={colorScheme === 'dark' ? '#D1D5DB' : '#9CA3AF'}
							/>
							<Text className="mt-4 text-gray-500 dark:text-gray-300">
								{t('add-device-no-devices-found') || '暂无发现设备'}
							</Text>
						</View>
					) : (
						<FlatList
							data={devices}
							keyExtractor={(item) => item.id}
							numColumns={2}
							columnWrapperStyle={{
								justifyContent: 'space-between',
								gap: 12, // 列间距
							}}
							contentContainerStyle={{
								paddingHorizontal: 16,
								paddingTop: 8,
								paddingBottom: 150,
							}}
							showsVerticalScrollIndicator={false}
							renderItem={({ item }) => {
								const rssiInfo = getRssiInfo(item.rssi);
								const Icon = getDeviceTypeIcon(
									item.manufacturerData,
									item.name,
									item.id
								);
								const isSelected = selectedDevices.has(item.id);

								return (
									<Pressable
										disabled={isConnecting}
										onPress={() => {
											const set = new Set(selectedDevices);
											// eslint-disable-next-line no-unused-expressions
											set.has(item.id)
												? set.delete(item.id)
												: (set.clear(), set.add(item.id));
											setSelectedDevices(set);
										}}
										className={`mb-3 overflow-hidden rounded-2xl border-2 p-4 shadow-sm ${
											isSelected
												? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
												: 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
										}`}
										style={{ width: '48%' }}
									>
										<View className="mb-4 flex-row items-start justify-between">
											<View
												className={`h-10 w-10 items-center justify-center rounded-xl ${
													isSelected
														? 'bg-blue-500'
														: 'bg-gray-100 dark:bg-gray-800'
												}`}
												style={
													!isSelected
														? {
																backgroundColor: `${rssiInfo.color}15`,
															}
														: {}
												}
											>
												{isSelected ? (
													<Check size={20} color="white" strokeWidth={3} />
												) : (
													<Icon size={22} color={rssiInfo.color} />
												)}
											</View>
											<View className="flex-row items-end gap-[2px]">
												<rssiInfo.icon size={16} color={rssiInfo.color} />
											</View>
										</View>
										<View>
											<Text
												className="text-base font-bold text-gray-900 dark:text-white"
												numberOfLines={1}
											>
												{item.name}
											</Text>
											<Text
												className="mt-1 text-xs font-medium text-gray-500"
												numberOfLines={1}
											>
												RSSI: {item.rssi} dBm
											</Text>
										</View>
									</Pressable>
								);
							}}
						/>
					)}
				</View>
			</View>

			<CustomAlert
				visible={alertVisible}
				{...alertConfig}
				onCancel={() => setAlertVisible(false)}
			/>

			{/* 底部按钮 */}
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
						? t('add-device-action-connecting')
						: t('add-device-action-confirm'),
					backgroundColor: isConnecting
						? 'bg-gray-400'
						: 'bg-green-500 dark:bg-green-600',
					onPress: handleMainConfirm,
					disabled: isConnecting,
				}}
				showPrimary={!isConnecting}
				showSecondary={selectedDevices.size > 0}
			/>
		</>
	);
}
