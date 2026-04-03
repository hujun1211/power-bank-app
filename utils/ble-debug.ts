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
