# BLE Debug Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visible `BLE 调试` entry on the device detail page that opens a page scoped to the current detail device, reuses the active `BleService` session, supports manual message sending, and automatically receives device payloads.

**Architecture:** Keep BLE connection ownership inside `lib/ble-service.ts` and implement the feature entirely at the page layer. Add one small helper module for session validation, capability extraction, payload decoding, and log entry construction so the page stays readable and the core BLE service remains untouched.

**Tech Stack:** Expo Router, React Native, TypeScript, `react-native-ble-plx`, existing UI components (`TopTitle`, `DeviceActionButtons`, `RadioSelect`)

---

## File Structure

- Create: `app/(device)/ble-debug.tsx`
  - 独立 BLE 调试页，负责设备会话校验、service/characteristic 展示、发送区、日志区和监听生命周期。
- Create: `utils/ble-debug.ts`
  - 纯函数工具，负责会话状态判断、特征值能力提取、payload 解码、日志条目构建。
- Create: `__tests__/ble-debug-utils.check.ts`
  - 通过 `ts-node --transpile-only` 运行的轻量断言脚本，覆盖纯函数工具。
- Modify: `app/(device)/[id].tsx`
  - 在设备详情页底部增加可见的 `BLE 调试` 入口按钮。
- Modify: `app/(device)/_layout.tsx`
  - 注册 `ble-debug` 路由。

## Implementation Notes

- 不修改 `lib/ble-service.ts` 的连接、断开、错误分类逻辑。
- 调试页不调用 `connectAndPrepare`，只依赖 `BleService.getConnectedDevice()`。
- 页面卸载或切换接收 characteristic 时，只调用 `BleService.stopMonitor(...)`，不调用 `disconnect()`。
- 按用户最新要求，本次调试入口和调试页文案全部以内联中文实现，不修改 `i18n` 资源。
- 当前工作区已有与本任务无关的 `app.json` / `eas.json` 改动，执行时不要回滚或混入这些文件。

### Task 1: Add Pure BLE Debug Helpers

**Files:**

- Create: `utils/ble-debug.ts`
- Create: `__tests__/ble-debug-utils.check.ts`

- [ ] **Step 1: Write the failing assertion script**

Create `__tests__/ble-debug-utils.check.ts`:

```ts
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
	buildBleDebugLogEntry,
	decodeBleDebugPayload,
	getCharacteristicCapabilities,
	resolveBleDebugSessionState,
} from '../utils/ble-debug';

const readyState = resolveBleDebugSessionState('device-1', 'device-1');
assert.deepEqual(readyState, {
	status: 'ready',
	message: '当前连接状态正常',
});

const disconnectedState = resolveBleDebugSessionState('device-1', null);
assert.equal(disconnectedState.status, 'not_connected');
assert.equal(disconnectedState.message, '当前设备未连接，无法调试');

const mismatchState = resolveBleDebugSessionState('device-1', 'device-2');
assert.equal(mismatchState.status, 'device_mismatch');
assert.equal(mismatchState.message, '当前连接设备与详情页设备不一致');

assert.deepEqual(
	getCharacteristicCapabilities({
		isReadable: true,
		isWritableWithResponse: false,
		isWritableWithoutResponse: true,
		isNotifiable: true,
		isIndicatable: false,
	}),
	['read', 'writeWithoutResponse', 'notify']
);

const payload = decodeBleDebugPayload(Buffer.from('SSID:test\r\n', 'utf8'));
assert.equal(payload.hex, '535349443A746573740D0A');
assert.equal(payload.utf8, 'SSID:test\r\n');

const logEntry = buildBleDebugLogEntry({
	direction: 'SEND',
	message: '手动发送消息',
	serviceUUID: 'service-1',
	charUUID: 'char-1',
	payload: Buffer.from([0x41, 0x42]),
});

assert.equal(logEntry.direction, 'SEND');
assert.equal(logEntry.hex, '4142');
assert.equal(logEntry.utf8, 'AB');
assert.equal(logEntry.serviceUUID, 'service-1');
assert.equal(logEntry.charUUID, 'char-1');

console.log('ble-debug utils checks passed');
```

- [ ] **Step 2: Run the assertion script to verify it fails**

Run:

```bash
npx ts-node --transpile-only __tests__/ble-debug-utils.check.ts
```

Expected: fail with `Cannot find module '../utils/ble-debug'` or missing export errors.

- [ ] **Step 3: Write the minimal helper implementation**

Create `utils/ble-debug.ts`:

```ts
import { Buffer } from 'buffer';
import { nanoid } from 'nanoid/non-secure';

export type BleDebugSessionStatus =
	| 'ready'
	| 'not_connected'
	| 'device_mismatch';

export type BleDebugLogDirection = 'SEND' | 'RECV' | 'INFO' | 'ERROR';

export type BleCharacteristicCapability =
	| 'read'
	| 'writeWithResponse'
	| 'writeWithoutResponse'
	| 'notify'
	| 'indicate';

export interface BleDebugLogEntry {
	id: string;
	timestamp: string;
	direction: BleDebugLogDirection;
	message: string;
	serviceUUID?: string;
	charUUID?: string;
	hex?: string;
	utf8?: string | null;
}

interface CharacteristicLike {
	isReadable?: boolean | null;
	isWritableWithResponse?: boolean | null;
	isWritableWithoutResponse?: boolean | null;
	isNotifiable?: boolean | null;
	isIndicatable?: boolean | null;
}

export function resolveBleDebugSessionState(
	expectedDeviceId: string,
	connectedDeviceId: string | null | undefined
): {
	status: BleDebugSessionStatus;
	message: string;
} {
	if (!connectedDeviceId) {
		return {
			status: 'not_connected',
			message: '当前设备未连接，无法调试',
		};
	}

	if (connectedDeviceId !== expectedDeviceId) {
		return {
			status: 'device_mismatch',
			message: '当前连接设备与详情页设备不一致',
		};
	}

	return {
		status: 'ready',
		message: '当前连接状态正常',
	};
}

export function getCharacteristicCapabilities(
	characteristic: CharacteristicLike
): BleCharacteristicCapability[] {
	const capabilities: BleCharacteristicCapability[] = [];

	if (characteristic.isReadable) capabilities.push('read');
	if (characteristic.isWritableWithResponse)
		capabilities.push('writeWithResponse');
	if (characteristic.isWritableWithoutResponse)
		capabilities.push('writeWithoutResponse');
	if (characteristic.isNotifiable) capabilities.push('notify');
	if (characteristic.isIndicatable) capabilities.push('indicate');

	return capabilities;
}

export function decodeBleDebugPayload(data: Buffer): {
	hex: string;
	utf8: string | null;
} {
	const hex = data.toString('hex').toUpperCase();

	try {
		return {
			hex,
			utf8: data.toString('utf8'),
		};
	} catch {
		return {
			hex,
			utf8: null,
		};
	}
}

export function buildBleDebugLogEntry({
	direction,
	message,
	serviceUUID,
	charUUID,
	payload,
}: {
	direction: BleDebugLogDirection;
	message: string;
	serviceUUID?: string;
	charUUID?: string;
	payload?: Buffer;
}): BleDebugLogEntry {
	const decoded = payload ? decodeBleDebugPayload(payload) : undefined;

	return {
		id: nanoid(),
		timestamp: new Date().toISOString(),
		direction,
		message,
		serviceUUID,
		charUUID,
		hex: decoded?.hex,
		utf8: decoded?.utf8 ?? null,
	};
}
```

- [ ] **Step 4: Run the assertion script to verify it passes**

Run:

```bash
npx ts-node --transpile-only __tests__/ble-debug-utils.check.ts
```

Expected: exit `0` and print `ble-debug utils checks passed`.

- [ ] **Step 5: Commit**

```bash
git add utils/ble-debug.ts __tests__/ble-debug-utils.check.ts
git commit -m "feat: add ble debug helper utilities"
```

### Task 2: Wire the Device Detail Entry and Route

**Files:**

- Modify: `app/(device)/[id].tsx`
- Modify: `app/(device)/_layout.tsx`

- [ ] **Step 1: Register the BLE debug route**

Update `app/(device)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function DeviceLayout() {
	return (
		<Stack
			screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
		>
			<Stack.Screen name="[id]" />
			<Stack.Screen name="add" />
			<Stack.Screen name="ble-debug" />
			<Stack.Screen name="ota" />
			<Stack.Screen name="map" />
		</Stack>
	);
}
```

- [ ] **Step 2: Add the visible entry button to the detail page**

Update the `DeviceActionButtons` block near the bottom of `app/(device)/[id].tsx`:

```tsx
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
	}}
	showSecondary={true}
/>
```

- [ ] **Step 3: Lint the entry changes**

Run:

```bash
npx eslint 'app/(device)/[id].tsx' 'app/(device)/_layout.tsx'
```

Expected: exit `0`.

- [ ] **Step 4: Commit**

```bash
git add 'app/(device)/[id].tsx' 'app/(device)/_layout.tsx'
git commit -m "feat: add ble debug entry from device detail"
```

### Task 3: Build the BLE Debug Page Shell and Channel Discovery

**Files:**

- Create: `app/(device)/ble-debug.tsx`
- Use: `utils/ble-debug.ts`
- Use: `components/ui/radio-select.tsx`

- [ ] **Step 1: Create the page shell with current-device validation**

Create `app/(device)/ble-debug.tsx`:

```tsx
import RadioSelect, { SelectOption } from '@/components/ui/radio-select';
import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import BleService from '@/lib/ble-service';
import {
	buildBleDebugLogEntry,
	getCharacteristicCapabilities,
	resolveBleDebugSessionState,
	type BleDebugLogEntry,
} from '@/utils/ble-debug';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Device } from 'react-native-ble-plx';

type CharacteristicOption = SelectOption<string> & {
	serviceUUID: string;
	charUUID: string;
	supportsSend: boolean;
	supportsReceive: boolean;
};

export default function BleDebugPage() {
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
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

	const appendLog = (entry: BleDebugLogEntry) => {
		setLogs((prev) => [...prev, entry]);
	};

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
							当前连接设备 ID: {connectedDevice?.id ?? sessionMessage}
						</Text>
					</View>
				</ScrollView>
			</View>
		</>
	);
}
```

- [ ] **Step 2: Discover services and characteristics for the active session**

Extend the page with a loading effect:

```tsx
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
				appendLog(
					buildBleDebugLogEntry({
						direction: 'INFO',
						message: `已加载 ${mappedOptions.length} 个特征值`,
					})
				);
			}
		} catch (error: any) {
			if (!cancelled) {
				appendLog(
					buildBleDebugLogEntry({
						direction: 'ERROR',
						message: error?.message || '读取 BLE 通道失败',
					})
				);
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
```

- [ ] **Step 3: Render the session warning and channel selectors**

Add the derived options and render blocks:

```tsx
const sendOptions = useMemo(
	() => channelOptions.filter((option) => option.supportsSend),
	[channelOptions]
);

const receiveOptions = useMemo(
	() => channelOptions.filter((option) => option.supportsReceive),
	[channelOptions]
);

{
	!isSessionReady && (
		<View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
			<Text className="text-sm text-amber-700 dark:text-amber-200">
				{sessionMessage}
			</Text>
		</View>
	);
}

<View className="mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
	<View className="mb-3 flex-row items-center gap-2">
		<Waypoints
			size={18}
			color={colorScheme === 'dark' ? '#E5E7EB' : '#111827'}
		/>
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
			<RadioSelect
				title="接收通道"
				options={receiveOptions}
				selectedId={selectedReceiveOptionId}
				onSelect={setSelectedReceiveOptionId}
			/>
		</>
	)}
</View>;
```

- [ ] **Step 4: Lint the page shell**

Run:

```bash
npx eslint 'app/(device)/ble-debug.tsx' 'utils/ble-debug.ts'
```

Expected: exit `0`.

- [ ] **Step 5: Commit**

```bash
git add 'app/(device)/ble-debug.tsx' 'utils/ble-debug.ts'
git commit -m "feat: add ble debug page shell"
```

### Task 4: Add Manual Send, Automatic Receive, and Log Cleanup

**Files:**

- Modify: `app/(device)/ble-debug.tsx`
- Use: `utils/ble-debug.ts`

- [ ] **Step 1: Implement the send action**

Add the selected option lookups and send handler:

```tsx
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

const handleSend = async () => {
	if (!isSessionReady || !selectedSendOption || !message.trim()) {
		return;
	}

	const payload = Buffer.from(message, 'utf8');

	appendLog(
		buildBleDebugLogEntry({
			direction: 'SEND',
			message: '手动发送消息',
			serviceUUID: selectedSendOption.serviceUUID,
			charUUID: selectedSendOption.charUUID,
			payload,
		})
	);

	try {
		await BleService.send(
			selectedSendOption.serviceUUID,
			selectedSendOption.charUUID,
			message,
			withResponse
		);
	} catch (error: any) {
		appendLog(
			buildBleDebugLogEntry({
				direction: 'ERROR',
				message: error?.message || '发送消息失败',
				serviceUUID: selectedSendOption.serviceUUID,
				charUUID: selectedSendOption.charUUID,
				payload,
			})
		);
	}
};
```

- [ ] **Step 2: Start and stop monitoring automatically when the receive channel changes**

Add the effect:

```tsx
useEffect(() => {
	if (!isSessionReady || !selectedReceiveOption) {
		return;
	}

	appendLog(
		buildBleDebugLogEntry({
			direction: 'INFO',
			message: '开始监听设备回包',
			serviceUUID: selectedReceiveOption.serviceUUID,
			charUUID: selectedReceiveOption.charUUID,
		})
	);

	try {
		BleService.monitor(
			selectedReceiveOption.serviceUUID,
			selectedReceiveOption.charUUID,
			(data) => {
				appendLog(
					buildBleDebugLogEntry({
						direction: 'RECV',
						message: '收到设备回包',
						serviceUUID: selectedReceiveOption.serviceUUID,
						charUUID: selectedReceiveOption.charUUID,
						payload: data,
					})
				);
			}
		);
	} catch (error: any) {
		appendLog(
			buildBleDebugLogEntry({
				direction: 'ERROR',
				message: error?.message || '启动监听失败',
				serviceUUID: selectedReceiveOption.serviceUUID,
				charUUID: selectedReceiveOption.charUUID,
			})
		);
	}

	return () => {
		void BleService.stopMonitor(
			selectedReceiveOption.serviceUUID,
			selectedReceiveOption.charUUID
		);
	};
}, [isSessionReady, selectedReceiveOption]);
```

- [ ] **Step 3: Render the send panel and log panel**

Add these sections below the channel selectors:

```tsx
<View className="mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
	<View className="mb-3 flex-row items-center gap-2">
		<Send size={18} color={colorScheme === 'dark' ? '#E5E7EB' : '#111827'} />
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
		disabled={!isSessionReady || !selectedSendOption || !message.trim()}
		className="mt-3 items-center rounded-xl bg-blue-600 px-4 py-4 disabled:bg-gray-300 dark:disabled:bg-gray-700"
	>
		<Text className="text-base font-semibold text-white">发送消息</Text>
	</Pressable>
</View>

<View className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
	<View className="mb-3 flex-row items-center justify-between">
		<View className="flex-row items-center gap-2">
			<Info size={18} color={colorScheme === 'dark' ? '#E5E7EB' : '#111827'} />
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
```

- [ ] **Step 4: Run focused verification**

Run:

```bash
npx ts-node --transpile-only __tests__/ble-debug-utils.check.ts
npx eslint 'app/(device)/ble-debug.tsx' 'app/(device)/[id].tsx' 'app/(device)/_layout.tsx' 'utils/ble-debug.ts'
```

Expected:

- `ble-debug utils checks passed`
- ESLint exits `0`

- [ ] **Step 5: Manual verification on a connected device**

Verify on a real device:

```text
1. 从设备详情页进入 BLE 调试页
2. 确认页面显示当前详情页设备 ID 和当前连接设备 ID
3. 确认 service / characteristic 列表加载成功
4. 选择一个写 characteristic，输入消息并发送
5. 选择一个 notify/indicate characteristic，确认设备回包追加到日志区
6. 返回设备详情页，确认没有触发自动断连
```

- [ ] **Step 6: Commit**

```bash
git add 'app/(device)/ble-debug.tsx' 'app/(device)/[id].tsx' 'app/(device)/_layout.tsx' 'utils/ble-debug.ts' '__tests__/ble-debug-utils.check.ts'
git commit -m "feat: add ble debug page for connected device"
```

## Self-Review

### Spec coverage

- 设备详情页常驻入口：Task 2
- 独立页面且绑定当前详情页设备：Task 2, Task 3
- 不自动重连，只复用当前会话：Task 3
- 展示 serviceUUID / charUUID 并选择通道：Task 3
- 手动发送消息：Task 4
- 自动接收 notify/indicate 消息：Task 4
- 结构化日志：Task 1, Task 4
- 返回详情页时只停监听不主动断连：Task 4
- 不处理 i18n，改为内联中文文案：Task 2, Task 3, Task 4

### Placeholder scan

- 没有 `TBD` / `TODO` / “稍后实现” 类占位。
- 所有命令都给出了明确路径和预期。
- 所有新增函数和状态命名在任务间保持一致。

### Type consistency

- 会话状态统一使用 `resolveBleDebugSessionState`
- 日志结构统一使用 `BleDebugLogEntry`
- characteristic 选项统一使用 `CharacteristicOption`
- 调试页始终使用 `selectedSendOptionId` / `selectedReceiveOptionId`
