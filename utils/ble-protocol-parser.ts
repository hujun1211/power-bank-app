import { Buffer } from 'buffer';

/**
 * 蓝牙协议解析结果
 */
export interface BleProtocolData {
	valid: boolean;
	error?: string;
	data?: {
		battery_percent: number;
		charge_cycles: number;
		port_c1_power_w: number;
		port_c2_power_w: number;
		port_a1_power_w: number;
		temperature_c: number;
		checksum_valid: boolean;
	};
}

/**
 * 解析蓝牙设备发送的状态数据包
 * 数据包格式（15字节）：
 * - Byte 0: 包头 0xAA
 * - Byte 1: 命令字 0x01 (状态上报)
 * - Byte 2: 电量百分比 (0-100)
 * - Byte 3-4: 充电次数 (uint16, 高字节在前)
 * - Byte 5-6: C1端口功率 (uint16, 高字节在前, 单位W)
 * - Byte 7-8: C2端口功率 (uint16, 高字节在前, 单位W)
 * - Byte 9-10: A1端口功率 (uint16, 高字节在前, 单位W)
 * - Byte 11: 温度 (实际温度 + 40)
 * - Byte 12: 校验和 (Byte 2 到 Byte 11 的累加，取低8位)
 * - Byte 13: 包尾 0x0D (\r)
 * - Byte 14: 包尾 0x0A (\n)
 */
export function parseBleStatusPacket(buffer: Buffer): BleProtocolData {
	// 检查数据包长度
	if (buffer.length !== 15) {
		return {
			valid: false,
			error: `数据包长度错误: 期望15字节，实际${buffer.length}字节`,
		};
	}

	// 检查包头
	if (buffer[0] !== 0xaa) {
		return {
			valid: false,
			error: `包头错误: 期望0xAA，实际0x${buffer[0].toString(16).toUpperCase()}`,
		};
	}

	// 检查命令字
	if (buffer[1] !== 0x01) {
		return {
			valid: false,
			error: `命令字错误: 期望0x01，实际0x${buffer[1].toString(16).toUpperCase()}`,
		};
	}

	// 检查包尾
	if (buffer[13] !== 0x0d || buffer[14] !== 0x0a) {
		return {
			valid: false,
			error: `包尾错误: 期望0x0D 0x0A，实际0x${buffer[13].toString(16).toUpperCase()} 0x${buffer[14].toString(16).toUpperCase()}`,
		};
	}

	// 计算校验和
	let calculatedChecksum = 0;
	for (let i = 2; i <= 11; i++) {
		calculatedChecksum += buffer[i];
	}
	calculatedChecksum = calculatedChecksum & 0xff; // 取低8位

	const receivedChecksum = buffer[12];
	const checksumValid = calculatedChecksum === receivedChecksum;

	// 解析数据
	const battery_percent = buffer[2];
	const charge_cycles = (buffer[3] << 8) | buffer[4];
	const port_c1_power_w = (buffer[5] << 8) | buffer[6];
	const port_c2_power_w = (buffer[7] << 8) | buffer[8];
	const port_a1_power_w = (buffer[9] << 8) | buffer[10];
	const temperature_c = buffer[11] - 40;

	return {
		valid: true,
		data: {
			battery_percent,
			charge_cycles,
			port_c1_power_w,
			port_c2_power_w,
			port_a1_power_w,
			temperature_c,
			checksum_valid: checksumValid,
		},
	};
}

/**
 * 将解析结果格式化为易读的JSON字符串
 */
export function formatBleProtocolData(result: BleProtocolData): string {
	if (!result.valid) {
		return JSON.stringify(
			{
				error: result.error,
			},
			null,
			2
		);
	}

	if (!result.data) {
		return JSON.stringify({ error: '无数据' }, null, 2);
	}

	return JSON.stringify(
		{
			电量: `${result.data.battery_percent}%`,
			充电次数: result.data.charge_cycles,
			C1端口功率: `${result.data.port_c1_power_w}W`,
			C2端口功率: `${result.data.port_c2_power_w}W`,
			A1端口功率: `${result.data.port_a1_power_w}W`,
			温度: `${result.data.temperature_c}℃`,
			校验和: result.data.checksum_valid ? '✓ 正确' : '✗ 错误',
		},
		null,
		2
	);
}
