import { appendStoredDeviceIfMissing } from '../utils/add-device-storage';

describe('appendStoredDeviceIfMissing', () => {
	it('adds a new device with fallback name and timestamp', () => {
		const existingDevices = [
			{
				id: 'existing-device',
				name: 'Existing Device',
				addedAt: '2026-04-01T00:00:00.000Z',
			},
		];

		expect(
			appendStoredDeviceIfMissing(existingDevices, {
				id: 'new-device',
				name: '',
				fallbackName: 'Power Bank 01',
				manufacturerData: 'demo-manufacturer',
				addedAt: '2026-04-03T08:00:00.000Z',
			})
		).toEqual([
			...existingDevices,
			{
				id: 'new-device',
				name: 'Power Bank 01',
				manufacturerData: 'demo-manufacturer',
				addedAt: '2026-04-03T08:00:00.000Z',
			},
		]);
	});

	it('keeps the list unchanged when the device already exists', () => {
		const existingDevices = [
			{
				id: 'existing-device',
				name: 'Existing Device',
				addedAt: '2026-04-01T00:00:00.000Z',
			},
		];

		expect(
			appendStoredDeviceIfMissing(existingDevices, {
				id: 'existing-device',
				name: 'Updated Name',
				fallbackName: 'Power Bank 02',
				addedAt: '2026-04-03T08:00:00.000Z',
			})
		).toEqual(existingDevices);
	});
});
