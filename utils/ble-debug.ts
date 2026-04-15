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

export type BleDebugChannelRole = 'command' | 'response';

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
	if (characteristic.isWritableWithResponse) {
		capabilities.push('writeWithResponse');
	}
	if (characteristic.isWritableWithoutResponse) {
		capabilities.push('writeWithoutResponse');
	}
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

export function shouldShowBleDebugCommandOption(
	capabilities: BleCharacteristicCapability[]
): boolean {
	return (
		capabilities.includes('writeWithResponse') ||
		capabilities.includes('writeWithoutResponse')
	);
}

export function shouldShowBleDebugResponseOption(
	capabilities: BleCharacteristicCapability[]
): boolean {
	return capabilities.includes('notify') || capabilities.includes('indicate');
}
