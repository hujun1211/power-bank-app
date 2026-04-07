export type DeviceDetailConnectionStatus =
	| 'idle'
	| 'connecting'
	| 'connected'
	| 'failed';

export function shouldAutoConnectDetailDevice(
	expectedDeviceId: string,
	connectedDeviceId: string | null | undefined
): boolean {
	return Boolean(expectedDeviceId) && connectedDeviceId !== expectedDeviceId;
}

export function getDeviceDetailConnectionLabel(
	status: DeviceDetailConnectionStatus
): string {
	switch (status) {
		case 'connecting':
			return '连接中...';
		case 'connected':
			return '蓝牙已连接';
		case 'failed':
			return '连接失败，请重试';
		default:
			return '未建立蓝牙连接';
	}
}

export function canOpenBleDebugForDevice(
	status: DeviceDetailConnectionStatus
): boolean {
	return status === 'connected';
}

export function shouldShowManualConnectButton(
	status: DeviceDetailConnectionStatus
): boolean {
	return status === 'idle' || status === 'failed';
}
