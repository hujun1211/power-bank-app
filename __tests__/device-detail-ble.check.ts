/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const {
	canOpenBleDebugForDevice,
	getDeviceDetailConnectionLabel,
	shouldShowManualConnectButton,
	shouldAutoConnectDetailDevice,
} = require('../utils/device-detail-ble');

assert.equal(shouldAutoConnectDetailDevice('device-1', null), true);
assert.equal(shouldAutoConnectDetailDevice('device-1', 'device-2'), true);
assert.equal(shouldAutoConnectDetailDevice('device-1', 'device-1'), false);

assert.equal(getDeviceDetailConnectionLabel('idle'), '未建立蓝牙连接');
assert.equal(getDeviceDetailConnectionLabel('connecting'), '连接中...');
assert.equal(getDeviceDetailConnectionLabel('connected'), '蓝牙已连接');
assert.equal(getDeviceDetailConnectionLabel('failed'), '连接失败，请重试');

assert.equal(canOpenBleDebugForDevice('idle'), false);
assert.equal(canOpenBleDebugForDevice('connecting'), false);
assert.equal(canOpenBleDebugForDevice('failed'), false);
assert.equal(canOpenBleDebugForDevice('connected'), true);

assert.equal(shouldShowManualConnectButton('idle'), true);
assert.equal(shouldShowManualConnectButton('failed'), true);
assert.equal(shouldShowManualConnectButton('connecting'), false);
assert.equal(shouldShowManualConnectButton('connected'), false);

console.log('device-detail-ble checks passed');
