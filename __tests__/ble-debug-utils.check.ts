/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const {
	buildBleDebugLogEntry,
	decodeBleDebugPayload,
	getCharacteristicCapabilities,
	resolveBleDebugSessionState,
} = require('../utils/ble-debug');

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
