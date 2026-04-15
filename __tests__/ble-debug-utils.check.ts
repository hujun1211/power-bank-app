/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const {
	buildBleDebugLogEntry,
	canSendBleDebugCommand,
	decodeBleDebugPayload,
	getBleDebugChannelRole,
	getBleDebugResponseChannelNotice,
	getCharacteristicCapabilities,
	resolveBleDebugSessionState,
	shouldShowBleDebugCommandOption,
	shouldShowBleDebugResponseOption,
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

assert.equal(canSendBleDebugCommand(true, true), true);
assert.equal(canSendBleDebugCommand(true, false), false);
assert.equal(canSendBleDebugCommand(false, true), false);

assert.equal(getBleDebugChannelRole('0000fff1-abcd'), 'command');
assert.equal(getBleDebugChannelRole('0000FFF2-abcd'), 'response');
assert.equal(getBleDebugChannelRole('0000180f-0000'), null);
assert.equal(shouldShowBleDebugCommandOption(['writeWithResponse']), true);
assert.equal(shouldShowBleDebugCommandOption(['writeWithoutResponse']), true);
assert.equal(shouldShowBleDebugCommandOption(['read']), false);
assert.equal(shouldShowBleDebugResponseOption(['notify']), true);
assert.equal(shouldShowBleDebugResponseOption(['indicate']), true);
assert.equal(shouldShowBleDebugResponseOption(['read']), false);

assert.equal(getBleDebugResponseChannelNotice(true), null);
assert.equal(
	getBleDebugResponseChannelNotice(false),
	'尚未选择设备回包通道，设备即使回包也不会被当前页面捕获'
);

console.log('ble-debug utils checks passed');
