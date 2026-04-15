# BLE Debug Protocol Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing BLE debug page so it matches the device's real protocol model: one command-send channel and one device-response channel, while also exposing a full diagnostics list of every discovered characteristic.

**Architecture:** Keep the existing `BleService` usage intact and refine only the page-layer semantics. Move role/guardrail/diagnostic labeling logic into `utils/ble-debug.ts` so the page stays readable, the protocol-mode behavior remains deterministic, and the full-channel diagnostics can be rendered from the same derived metadata.

**Tech Stack:** Expo Router, React Native, TypeScript, `react-native-ble-plx`, existing `BleService`, `RadioSelect`

---

## File Structure

- Modify: `app/(device)/ble-debug.tsx`
  - Rename the UI semantics to `命令发送通道 / 设备回包通道`, enforce the new send/receive guardrails, show response-channel guidance, and render a full diagnostics list of all characteristics.
- Modify: `utils/ble-debug.ts`
  - Add small pure helpers for protocol-mode behavior, channel-role detection, response-channel notice text, send-button eligibility, and diagnostics labels.
- Modify: `__tests__/ble-debug-utils.check.ts`
  - Extend the existing lightweight assertion script to cover protocol-mode helpers and diagnostics role labeling.

## Implementation Notes

- Do not change `lib/ble-service.ts`.
- Do not touch device detail auto-connect logic in `app/(device)/[id].tsx`.
- Keep all new copy inline in Chinese; do not add `i18n` keys.
- Preserve the existing route and page entry; this is a refinement of the current BLE debug page, not a new feature branch.

### Task 1: Add Protocol-Mode and Diagnostics Helpers

**Files:**

- Modify: `utils/ble-debug.ts`
- Modify: `__tests__/ble-debug-utils.check.ts`

- [ ] **Step 1: Write the failing assertions for protocol-mode helpers and diagnostics labels**

Extend `__tests__/ble-debug-utils.check.ts` with assertions for the protocol-mode guardrails:

```ts
const {
	buildBleDebugLogEntry,
	canSendBleDebugCommand,
	decodeBleDebugPayload,
	getBleDebugChannelRole,
	getBleDebugResponseChannelNotice,
	getCharacteristicCapabilities,
	resolveBleDebugSessionState,
} = require('../utils/ble-debug');

assert.equal(canSendBleDebugCommand(true, true), true);
assert.equal(canSendBleDebugCommand(true, false), false);
assert.equal(canSendBleDebugCommand(false, true), false);

assert.equal(getBleDebugResponseChannelNotice(true), null);
assert.equal(
	getBleDebugResponseChannelNotice(false),
	'尚未选择设备回包通道，设备即使回包也不会被当前页面捕获'
);

assert.equal(getBleDebugChannelRole('0000fff1-abcd'), 'command');
assert.equal(getBleDebugChannelRole('0000FFF2-abcd'), 'response');
assert.equal(getBleDebugChannelRole('0000180f-0000'), null);
```

- [ ] **Step 2: Run the lightweight check to verify it fails**

Run:

```bash
node -r ts-node/register/transpile-only -e "require('./__tests__/ble-debug-utils.check.ts')"
```

Expected: fail because one or more protocol/diagnostics helpers do not exist yet.

- [ ] **Step 3: Implement the minimal protocol-mode and diagnostics helpers**

Append these helpers to `utils/ble-debug.ts`:

```ts
export function canSendBleDebugCommand(
	isSessionReady: boolean,
	hasSelectedCommandChannel: boolean
): boolean {
	return isSessionReady && hasSelectedCommandChannel;
}

export function getBleDebugResponseChannelNotice(
	hasSelectedResponseChannel: boolean
): string | null {
	if (hasSelectedResponseChannel) {
		return null;
	}

	return '尚未选择设备回包通道，设备即使回包也不会被当前页面捕获';
}

export type BleDebugChannelRole = 'command' | 'response';

export function getBleDebugChannelRole(
	charUUID: string
): BleDebugChannelRole | null {
	const normalized = charUUID.toLowerCase();

	if (normalized.startsWith('0000fff1')) {
		return 'command';
	}

	if (normalized.startsWith('0000fff2')) {
		return 'response';
	}

	return null;
}
```

- [ ] **Step 4: Run the lightweight check to verify it passes**

Run:

```bash
node -r ts-node/register/transpile-only -e "require('./__tests__/ble-debug-utils.check.ts')"
```

Expected: exit `0` and print `ble-debug utils checks passed`.

- [ ] **Step 5: Commit**

```bash
git add utils/ble-debug.ts __tests__/ble-debug-utils.check.ts
git commit -m "feat: add ble debug protocol guardrails"
```

### Task 2: Refine BLE Debug Page Into Protocol Mode

**Files:**

- Modify: `app/(device)/ble-debug.tsx`
- Use: `utils/ble-debug.ts`

- [ ] **Step 1: Import the new helpers and compute protocol-mode state**

Update the helper import block and derive the response notice:

```tsx
import {
	buildBleDebugLogEntry,
	canSendBleDebugCommand,
	getBleDebugChannelRole,
	getBleDebugResponseChannelNotice,
	getCharacteristicCapabilities,
	type BleDebugLogEntry,
	resolveBleDebugSessionState,
} from '@/utils/ble-debug';

const responseChannelNotice = getBleDebugResponseChannelNotice(
	Boolean(selectedReceiveOption)
);

const canSendMessage = canSendBleDebugCommand(
	isSessionReady,
	Boolean(selectedSendOption && message.trim())
);
```

- [ ] **Step 2: Rename the UI semantics to match the protocol model**

Update the channel section copy in `app/(device)/ble-debug.tsx`:

```tsx
<RadioSelect
	title="命令发送通道"
	options={sendOptions}
	selectedId={selectedSendOptionId}
	onSelect={setSelectedSendOptionId}
/>

<RadioSelect
	title="设备回包通道"
	options={receiveOptions}
	selectedId={selectedReceiveOptionId}
	onSelect={setSelectedReceiveOptionId}
/>
```

Also rename the state-area labels to make the current model obvious:

```tsx
<Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
	当前状态: {sessionMessage}
</Text>
```

No route or data-flow change is needed here; only the page semantics become more precise.

- [ ] **Step 3: Add the response-channel warning and tighten send-button eligibility**

Render a visible warning when no response channel is selected:

```tsx
{
	responseChannelNotice && (
		<View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
			<Text className="text-sm text-amber-700 dark:text-amber-200">
				{responseChannelNotice}
			</Text>
		</View>
	);
}
```

Then update the send button to depend on `canSendMessage`:

```tsx
<Pressable
	onPress={handleSend}
	disabled={!canSendMessage}
	className="mt-3 items-center rounded-xl bg-blue-600 px-4 py-4 disabled:bg-gray-300 dark:disabled:bg-gray-700"
>
	<Text className="text-base font-semibold text-white">发送消息</Text>
</Pressable>
```

- [ ] **Step 4: Make the logs reflect protocol roles rather than generic send/receive**

Update the informational log copy so it matches the command/response mental model:

```tsx
buildBleDebugLogEntry({
	direction: 'INFO',
	message: '开始监听设备回包通道',
	serviceUUID: selectedReceiveOption.serviceUUID,
	charUUID: selectedReceiveOption.charUUID,
});
```

And for send:

```tsx
buildBleDebugLogEntry({
	direction: 'SEND',
	message: '向命令发送通道写入消息',
	serviceUUID: selectedSendOption.serviceUUID,
	charUUID: selectedSendOption.charUUID,
	payload,
});
```

And for receive:

```tsx
buildBleDebugLogEntry({
	direction: 'RECV',
	message: '收到设备回包通道数据',
	serviceUUID: selectedReceiveOption.serviceUUID,
	charUUID: selectedReceiveOption.charUUID,
	payload: data,
});
```

- [ ] **Step 5: Filter the protocol selectors by the fixed `fff1 / fff2` rules**

Update the channel discovery mapping so roles are derived from `charUUID` prefixes:

```tsx
const channelRole = getBleDebugChannelRole(characteristic.uuid);

mappedOptions.push({
	id: `${service.uuid}::${characteristic.uuid}`,
	title: characteristic.uuid,
	description: `${service.uuid} · ${capabilities.join(', ') || 'none'}`,
	serviceUUID: service.uuid,
	charUUID: characteristic.uuid,
	supportsSend:
		channelRole === 'command' &&
		(characteristic.isWritableWithResponse === true ||
			characteristic.isWritableWithoutResponse === true),
	supportsReceive:
		channelRole === 'response' &&
		(characteristic.isNotifiable === true ||
			characteristic.isIndicatable === true),
});
```

Also update the empty-state text:

```tsx
未找到以 0000fff1 开头的命令发送通道
未找到以 0000fff2 开头的设备回包通道
```

### Task 3: Add the Full Diagnostics Channel List

**Files:**

- Modify: `app/(device)/ble-debug.tsx`
- Use: `utils/ble-debug.ts`

- [ ] **Step 1: Extend the page data model so every characteristic can be rendered in diagnostics**

Update the page-local option type so diagnostics can reuse the same mapped list:

```tsx
type CharacteristicOption = SelectOption<string> & {
	serviceUUID: string;
	charUUID: string;
	supportsSend: boolean;
	supportsReceive: boolean;
	role: 'command' | 'response' | 'other';
};
```

During channel mapping, normalize the role:

```tsx
const detectedRole = getBleDebugChannelRole(characteristic.uuid);
const role = detectedRole ?? 'other';
```

- [ ] **Step 2: Render the full diagnostics section**

Insert a new section below the protocol selectors:

```tsx
<View className="mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
	<View className="mb-3 flex-row items-center gap-2">
		<Info size={18} color={iconColor} />
		<Text className="text-base font-semibold text-gray-900 dark:text-white">
			全部通道诊断
		</Text>
	</View>

	{channelOptions.length === 0 ? (
		<Text className="text-sm text-gray-500 dark:text-gray-400">
			暂无可展示的通道信息
		</Text>
	) : (
		channelOptions.map((option) => (
			<View
				key={`diag-${option.id}`}
				className="mb-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
			>
				<Text className="text-sm font-semibold text-gray-900 dark:text-white">
					{option.charUUID}
				</Text>
				<Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
					S: {option.serviceUUID}
				</Text>
				<Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
					能力: {option.description?.split(' · ')[1] || 'none'}
				</Text>
				<Text className="mt-1 text-xs text-blue-600 dark:text-blue-400">
					角色:
					{option.role === 'command'
						? ' 命令发送通道'
						: option.role === 'response'
							? ' 设备回包通道'
							: ' 其他通道'}
				</Text>
			</View>
		))
	)}
</View>
```

- [ ] **Step 3: Keep protocol selectors and diagnostics list in sync**

Ensure the selector filtering is derived from the single `channelOptions` list:

```tsx
const sendOptions = useMemo(
	() => channelOptions.filter((option) => option.supportsSend),
	[channelOptions]
);

const receiveOptions = useMemo(
	() => channelOptions.filter((option) => option.supportsReceive),
	[channelOptions]
);
```

No second discovery pass should be added.

- [ ] **Step 4: Run focused verification**

Run:

```bash
node -r ts-node/register/transpile-only -e "require('./__tests__/ble-debug-utils.check.ts')"
npx eslint 'app/(device)/ble-debug.tsx' 'utils/ble-debug.ts' '__tests__/ble-debug-utils.check.ts'
```

Expected:

- `ble-debug utils checks passed`
- ESLint exits `0`

- [ ] **Step 5: Manual verification on a real device**

Verify on device:

```text
1. 进入 BLE 调试页
2. 确认页面显示“命令发送通道”和“设备回包通道”
3. 未选命令发送通道时，发送按钮不可用
4. 未选设备回包通道时，页面显示明确提醒
5. 选中设备回包通道后，页面开始监听该通道
6. 页面额外显示“全部通道诊断”区域，并列出全部 characteristic
7. 每个 diagnostic 条目都标记为“命令发送通道 / 设备回包通道 / 其他通道”
8. 选中命令发送通道并发送消息，日志能明确区分“命令发送通道”和“设备回包通道”
```

- [ ] **Step 6: Commit**

```bash
git add app/(device)/ble-debug.tsx utils/ble-debug.ts __tests__/ble-debug-utils.check.ts
git commit -m "feat: add ble debug diagnostics list"
```

## Self-Review

### Spec coverage

- 命令发送通道 / 设备回包通道语义：Task 2
- 单一命令通道发送：Task 2
- 未选命令发送通道时禁用发送：Task 1, Task 2
- 未选设备回包通道时显示提醒：Task 1, Task 2
- `fff1 / fff2` 固定协议筛选：Task 1, Task 2
- 全部通道诊断区：Task 3
- 继续复用现有 `BleService` 会话：Task 2
- 日志更贴协议模式：Task 2
- 诊断区角色标签：Task 3

### Placeholder scan

- 没有 `TBD` / `TODO` / “稍后实现” 类占位。
- 所有命令、文件路径、文案都写明了。

### Type consistency

- `selectedSendOption` 统一代表命令发送通道
- `selectedReceiveOption` 统一代表设备回包通道
- `canSendBleDebugCommand` 与 `getBleDebugResponseChannelNotice` 负责协议模式的页面 guardrail
- `getBleDebugChannelRole` 负责固定前缀角色判断
