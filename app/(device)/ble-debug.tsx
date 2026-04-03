import RadioSelect, { SelectOption } from '@/components/ui/radio-select';
import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import BleService from '@/lib/ble-service';
import {
	buildBleDebugLogEntry,
	getCharacteristicCapabilities,
	type BleDebugLogEntry,
	resolveBleDebugSessionState,
} from '@/utils/ble-debug';
import { Buffer } from 'buffer';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Info, Send, Waypoints } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from 'react-native';
import type { Device } from 'react-native-ble-plx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CharacteristicOption = SelectOption<string> & {
	serviceUUID: string;
	charUUID: string;
	supportsSend: boolean;
	supportsReceive: boolean;
};

export default function BleDebugPage() {
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
	const iconColor = colorScheme === 'dark' ? '#E5E7EB' : '#111827';
	const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
	const deviceId = id ?? '';
	const deviceName = name ?? '';
	const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
	const [sessionMessage, setSessionMessage] =
		useState('当前设备未连接，无法调试');
	const [isSessionReady, setIsSessionReady] = useState(false);
	const [isLoadingChannels, setIsLoadingChannels] = useState(true);
	const [channelOptions, setChannelOptions] = useState<CharacteristicOption[]>(
		[]
	);
	const [logs, setLogs] = useState<BleDebugLogEntry[]>([]);
	const [selectedSendOptionId, setSelectedSendOptionId] = useState<
		string | null
	>(null);
	const [selectedReceiveOptionId, setSelectedReceiveOptionId] = useState<
		string | null
	>(null);
	const [message, setMessage] = useState('');
	const [withResponse, setWithResponse] = useState(false);

	useEffect(() => {
		const activeDevice = BleService.getConnectedDevice();
		setConnectedDevice(activeDevice);

		const state = resolveBleDebugSessionState(
			deviceId,
			activeDevice?.id ?? null
		);
		setSessionMessage(state.message);
		setIsSessionReady(state.status === 'ready');
	}, [deviceId]);

	useEffect(() => {
		let cancelled = false;

		const loadChannels = async () => {
			if (!isSessionReady) {
				setChannelOptions([]);
				setIsLoadingChannels(false);
				return;
			}

			setIsLoadingChannels(true);

			try {
				const activeDevice = BleService.getConnectedDevice();
				if (!activeDevice) {
					throw new Error('当前设备未连接，无法调试');
				}

				const services = await activeDevice.services();
				const mappedOptions: CharacteristicOption[] = [];

				for (const service of services) {
					const characteristics = await service.characteristics();

					for (const characteristic of characteristics) {
						const capabilities = getCharacteristicCapabilities(characteristic);
						mappedOptions.push({
							id: `${service.uuid}::${characteristic.uuid}`,
							title: characteristic.uuid,
							description: `${service.uuid} · ${capabilities.join(', ') || 'none'}`,
							serviceUUID: service.uuid,
							charUUID: characteristic.uuid,
							supportsSend:
								characteristic.isWritableWithResponse === true ||
								characteristic.isWritableWithoutResponse === true,
							supportsReceive:
								characteristic.isNotifiable === true ||
								characteristic.isIndicatable === true,
						});
					}
				}

				if (!cancelled) {
					setChannelOptions(mappedOptions);
					setLogs((prev) => [
						...prev,
						buildBleDebugLogEntry({
							direction: 'INFO',
							message: `已加载 ${mappedOptions.length} 个特征值`,
						}),
					]);
				}
			} catch (error: any) {
				if (!cancelled) {
					setLogs((prev) => [
						...prev,
						buildBleDebugLogEntry({
							direction: 'ERROR',
							message: error?.message || '读取 BLE 通道失败',
						}),
					]);
				}
			} finally {
				if (!cancelled) {
					setIsLoadingChannels(false);
				}
			}
		};

		void loadChannels();

		return () => {
			cancelled = true;
		};
	}, [isSessionReady]);

	const sendOptions = useMemo(
		() => channelOptions.filter((option) => option.supportsSend),
		[channelOptions]
	);

	const receiveOptions = useMemo(
		() => channelOptions.filter((option) => option.supportsReceive),
		[channelOptions]
	);

	const selectedSendOption = useMemo(
		() =>
			sendOptions.find((option) => option.id === selectedSendOptionId) ?? null,
		[sendOptions, selectedSendOptionId]
	);

	const selectedReceiveOption = useMemo(
		() =>
			receiveOptions.find((option) => option.id === selectedReceiveOptionId) ??
			null,
		[receiveOptions, selectedReceiveOptionId]
	);

	useEffect(() => {
		if (!isSessionReady || !selectedReceiveOption) {
			return;
		}

		setLogs((prev) => [
			...prev,
			buildBleDebugLogEntry({
				direction: 'INFO',
				message: '开始监听设备回包',
				serviceUUID: selectedReceiveOption.serviceUUID,
				charUUID: selectedReceiveOption.charUUID,
			}),
		]);

		try {
			BleService.monitor(
				selectedReceiveOption.serviceUUID,
				selectedReceiveOption.charUUID,
				(data) => {
					setLogs((prev) => [
						...prev,
						buildBleDebugLogEntry({
							direction: 'RECV',
							message: '收到设备回包',
							serviceUUID: selectedReceiveOption.serviceUUID,
							charUUID: selectedReceiveOption.charUUID,
							payload: data,
						}),
					]);
				}
			);
		} catch (error: any) {
			setLogs((prev) => [
				...prev,
				buildBleDebugLogEntry({
					direction: 'ERROR',
					message: error?.message || '启动监听失败',
					serviceUUID: selectedReceiveOption.serviceUUID,
					charUUID: selectedReceiveOption.charUUID,
				}),
			]);
		}

		return () => {
			void BleService.stopMonitor(
				selectedReceiveOption.serviceUUID,
				selectedReceiveOption.charUUID
			);
		};
	}, [isSessionReady, selectedReceiveOption]);

	const handleSend = async () => {
		if (!isSessionReady || !selectedSendOption || !message.trim()) {
			return;
		}

		const payload = Buffer.from(message, 'utf8');

		setLogs((prev) => [
			...prev,
			buildBleDebugLogEntry({
				direction: 'SEND',
				message: '手动发送消息',
				serviceUUID: selectedSendOption.serviceUUID,
				charUUID: selectedSendOption.charUUID,
				payload,
			}),
		]);

		try {
			await BleService.send(
				selectedSendOption.serviceUUID,
				selectedSendOption.charUUID,
				message,
				withResponse
			);
		} catch (error: any) {
			setLogs((prev) => [
				...prev,
				buildBleDebugLogEntry({
					direction: 'ERROR',
					message: error?.message || '发送消息失败',
					serviceUUID: selectedSendOption.serviceUUID,
					charUUID: selectedSendOption.charUUID,
					payload,
				}),
			]);
		}
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title="BLE 调试" showBack={true} />
			<View className="flex-1 bg-white dark:bg-black">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						padding: 16,
						paddingBottom: insets.bottom + 20,
					}}
				>
					<View className="mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
						<Text className="text-lg font-semibold text-gray-900 dark:text-white">
							{deviceName || '未知设备'}
						</Text>
						<Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
							详情页设备 ID: {deviceId}
						</Text>
						<Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
							当前连接设备 ID: {connectedDevice?.id ?? '无'}
						</Text>
						<Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
							当前状态: {sessionMessage}
						</Text>
					</View>

					{!isSessionReady && (
						<View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
							<Text className="text-sm text-amber-700 dark:text-amber-200">
								{sessionMessage}
							</Text>
						</View>
					)}

					<View className="mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
						<View className="mb-3 flex-row items-center gap-2">
							<Waypoints size={18} color={iconColor} />
							<Text className="text-base font-semibold text-gray-900 dark:text-white">
								通道选择
							</Text>
						</View>

						{isLoadingChannels ? (
							<View className="flex-row items-center gap-3 py-3">
								<ActivityIndicator size="small" color="#2563EB" />
								<Text className="text-sm text-gray-500 dark:text-gray-400">
									正在读取服务与特征值
								</Text>
							</View>
						) : (
							<>
								<RadioSelect
									title="发送通道"
									options={sendOptions}
									selectedId={selectedSendOptionId}
									onSelect={setSelectedSendOptionId}
								/>
								{sendOptions.length === 0 && (
									<Text className="mb-4 px-4 text-sm text-gray-500 dark:text-gray-400">
										未找到可发送的特征值
									</Text>
								)}
								<RadioSelect
									title="接收通道"
									options={receiveOptions}
									selectedId={selectedReceiveOptionId}
									onSelect={setSelectedReceiveOptionId}
								/>
								{receiveOptions.length === 0 && (
									<Text className="px-4 text-sm text-gray-500 dark:text-gray-400">
										未找到可接收回包的特征值
									</Text>
								)}
							</>
						)}
					</View>

					<View className="mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
						<View className="mb-3 flex-row items-center gap-2">
							<Send size={18} color={iconColor} />
							<Text className="text-base font-semibold text-gray-900 dark:text-white">
								发送消息
							</Text>
						</View>

						<TextInput
							value={message}
							onChangeText={setMessage}
							placeholder="输入要发送给设备的消息"
							multiline
							textAlignVertical="top"
							className="min-h-[120px] rounded-2xl border border-gray-200 bg-white p-4 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
						/>

						<Pressable
							onPress={() => setWithResponse((prev) => !prev)}
							className="mt-3 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
						>
							<Text className="text-sm text-gray-700 dark:text-gray-200">
								使用 With Response
							</Text>
							<Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
								{withResponse ? '已开启' : '已关闭'}
							</Text>
						</Pressable>

						<Pressable
							onPress={handleSend}
							disabled={
								!isSessionReady || !selectedSendOption || !message.trim()
							}
							className="mt-3 items-center rounded-xl bg-blue-600 px-4 py-4 disabled:bg-gray-300 dark:disabled:bg-gray-700"
						>
							<Text className="text-base font-semibold text-white">
								发送消息
							</Text>
						</Pressable>
					</View>

					<View className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
						<View className="mb-3 flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<Info size={18} color={iconColor} />
								<Text className="text-base font-semibold text-gray-900 dark:text-white">
									调试日志
								</Text>
							</View>

							<Pressable onPress={() => setLogs([])}>
								<Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
									清空日志
								</Text>
							</Pressable>
						</View>

						{logs.length === 0 ? (
							<Text className="text-sm text-gray-500 dark:text-gray-400">
								暂无 BLE 调试日志
							</Text>
						) : (
							logs.map((entry) => (
								<View
									key={entry.id}
									className="mb-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
								>
									<Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">
										{entry.direction} · {entry.timestamp}
									</Text>
									<Text className="mt-1 text-sm text-gray-900 dark:text-white">
										{entry.message}
									</Text>
									{entry.serviceUUID && (
										<Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
											S: {entry.serviceUUID}
										</Text>
									)}
									{entry.charUUID && (
										<Text className="text-xs text-gray-500 dark:text-gray-400">
											C: {entry.charUUID}
										</Text>
									)}
									{entry.hex && (
										<Text className="mt-2 text-xs text-gray-700 dark:text-gray-200">
											HEX: {entry.hex}
										</Text>
									)}
									{entry.utf8 && (
										<Text className="mt-1 text-xs text-gray-700 dark:text-gray-200">
											UTF8: {entry.utf8}
										</Text>
									)}
								</View>
							))
						)}
					</View>
				</ScrollView>
			</View>
		</>
	);
}
