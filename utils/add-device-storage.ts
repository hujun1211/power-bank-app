export interface StoredDevice {
	id: string;
	name: string;
	manufacturerData?: string;
	addedAt: string;
}

export interface PendingStoredDevice {
	id: string;
	name?: string | null;
	fallbackName?: string;
	manufacturerData?: string;
	addedAt?: string;
}

export function appendStoredDeviceIfMissing(
	devices: StoredDevice[],
	device: PendingStoredDevice
): StoredDevice[] {
	if (devices.some((item) => item.id === device.id)) {
		return devices;
	}

	return [
		...devices,
		{
			id: device.id,
			name: device.name || device.fallbackName || 'Unknown',
			manufacturerData: device.manufacturerData,
			addedAt: device.addedAt || new Date().toISOString(),
		},
	];
}
