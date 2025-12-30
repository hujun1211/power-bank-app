import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import {
	BleManager,
	Characteristic,
	Device,
	Subscription,
} from 'react-native-ble-plx';

/**
 * BLE 自定义错误类
 */
export class BleError extends Error {
	public readonly type: BleErrorType;
	public readonly originalError?: any;

	constructor(type: BleErrorType, message: string, originalError?: any) {
		super(message);
		this.name = 'BleError';
		this.type = type;
		this.originalError = originalError;
	}
}

/**
 * BLE 错误类型枚举
 */
export enum BleErrorType {
	// 连接相关
	CONNECTION_FAILED = 'connection_failed',
	CONNECTION_TIMEOUT = 'connection_timeout',
	DEVICE_DISCONNECTED = 'device_disconnected',
	DEVICE_NOT_FOUND = 'device_not_found',
	SYSTEM_CANCELLATION = 'system_cancellation',

	// 权限相关
	PERMISSION_DENIED = 'permission_denied',
	BLUETOOTH_DISABLED = 'bluetooth_disabled',

	// 服务和特征相关
	SERVICE_NOT_FOUND = 'service_not_found',
	CHARACTERISTIC_NOT_FOUND = 'characteristic_not_found',

	// 操作相关
	WRITE_FAILED = 'write_failed',
	READ_FAILED = 'read_failed',
	SCAN_FAILED = 'scan_failed',
	OPERATION_CANCELLED = 'operation_cancelled',

	// 设备相关
	DEVICE_UNSUPPORTED = 'device_unsupported',

	// 未知错误
	UNKNOWN = 'unknown',
}

/**
 * BLE 全局服务单例
 * 负责：
 * - manager 生命周期
 * - 设备连接状态
 * - characteristic 监听与清理
 */
class BleService {
	private static instance: BleService;

	/** BLE 原生管理器 */
	public manager: BleManager;

	/** 当前已连接设备 */
	private connectedDevice: Device | null = null;

	/**
	 * 当前所有监听的订阅
	 * key = serviceUUID-charUUID
	 * value = Subscription
	 */
	private monitorSubscriptions: Map<string, Subscription> = new Map();

	private constructor() {
		// manager 只在 service 初始化时创建
		this.manager = new BleManager();
	}

	/** 获取全局单例 */
	public static getInstance(): BleService {
		if (!BleService.instance) {
			BleService.instance = new BleService();
		}
		return BleService.instance;
	}

	/** 停止扫描，避免扫描与连接并发导致 native 不稳定 */
	async stopScan(): Promise<void> {
		try {
			await this.manager.stopDeviceScan();
		} catch {
			// stopDeviceScan 在某些状态下会抛异常，忽略即可
		}
	}

	/**
	 * 连接设备并完成必要初始化
	 * 不在这里做任何监听
	 */
	async connectAndPrepare(deviceId: string): Promise<Device> {
		try {
			// 1. 先尝试断开，但要给 Native 留出 500ms 释放资源
			await this.manager.cancelDeviceConnection(deviceId).catch(() => {});
			await new Promise((resolve) => setTimeout(resolve, 500));

			console.log(`[BleLib] 发起 Native 连接请求: ${deviceId}`);

			// 2. 连接设备，禁用 autoConnect 提高受控度
			const device = await this.manager.connectToDevice(deviceId, {
				autoConnect: false,
				timeout: 15000,
			});

			// 3. 发现服务和特征（连接不稳定时会在这里崩掉）
			await device.discoverAllServicesAndCharacteristics();

			// Android 下提升 MTU，失败也不影响主流程
			if (Platform.OS === 'android') {
				try {
					await device.requestMTU(512);
				} catch {
					// 某些设备不支持 requestMTU
				}
			}

			this.connectedDevice = device;
			return device;
		} catch (error: any) {
			const message = error?.message?.toLowerCase() || '';

			// 如果报错是 "Device is already connected"，其实可以认为是成功
			if (message.includes('already connected')) {
				try {
					const device = await this.manager
						.devices([deviceId])
						.then((ds) => ds[0]);
					if (device) {
						this.connectedDevice = device;
						return device;
					}
				} catch {
					// 如果获取已连接设备失败，继续抛错
				}
			}

			// 只有明确的用户主动取消操作才抛出 OPERATION_CANCELLED
			// 注意：我们在连接前调用 cancelDeviceConnection 可能会导致一些 'cancelled' 错误，
			// 但这些不是用户主动取消，应该归类为连接失败
			if (
				message.includes('operation was cancelled') &&
				message.includes('user')
			) {
				throw new BleError(
					BleErrorType.OPERATION_CANCELLED,
					'Connection was cancelled by user',
					error
				);
			}

			// 其他包含 'cancelled' 的错误可能是系统级别的取消，归类为连接失败
			if (message.includes('cancelled') || message.includes('destroyed')) {
				throw new BleError(
					BleErrorType.SYSTEM_CANCELLATION,
					'Connection failed due to system cancellation',
					error
				);
			}

			// 其他错误都归类为连接失败
			throw new BleError(
				BleErrorType.CONNECTION_FAILED,
				error.message || 'Connection failed',
				error
			);
		}
	}

	/**
	 * 写入数据
	 * @param serviceUUID 服务 UUID
	 * @param charUUID 特征 UUID
	 * @param data 字符串或字节数组
	 * @param withResponse 是否需要硬件回执 (默认 true，如果设备没反应，尝试改为 false)
	 */
	async send(
		serviceUUID: string,
		charUUID: string,
		data: string | number[],
		withResponse: boolean = true
	): Promise<Characteristic> {
		if (!this.connectedDevice) {
			throw new BleError(
				BleErrorType.DEVICE_DISCONNECTED,
				'Device not connected'
			);
		}

		// 统一构建 Buffer
		// 如果是字符串，按 UTF-8 转 Buffer
		// 如果是数组 [0x55, 0xAA]，转 Buffer
		const buffer =
			typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);

		// 2. 打印日志：这步最关键！看看发出去的 Hex 对不对
		console.log(`[BleLib] 发送数据到 ${charUUID.slice(0, 8)}...`);
		console.log(`[BleLib] 内容 (Hex): ${buffer.toString('hex').toUpperCase()}`);
		console.log(
			`[BleLib] 模式: ${withResponse ? 'WithResponse' : 'WithoutResponse'}`
		);

		const base64Data = buffer.toString('base64');

		try {
			if (withResponse) {
				return await this.connectedDevice.writeCharacteristicWithResponseForService(
					serviceUUID,
					charUUID,
					base64Data
				);
			} else {
				return await this.connectedDevice.writeCharacteristicWithoutResponseForService(
					serviceUUID,
					charUUID,
					base64Data
				);
			}
		} catch (error: any) {
			console.error(`[BleLib] 写入失败:`, error);
			const message = error?.message?.toLowerCase() || '';
			if (message.includes('characteristic') && message.includes('not found')) {
				throw new BleError(
					BleErrorType.CHARACTERISTIC_NOT_FOUND,
					'Characteristic not found',
					error
				);
			} else if (message.includes('service') && message.includes('not found')) {
				throw new BleError(
					BleErrorType.SERVICE_NOT_FOUND,
					'Service not found',
					error
				);
			} else {
				throw new BleError(BleErrorType.WRITE_FAILED, 'Write failed', error);
			}
		}
	}

	/**
	 * 读取一次特征值
	 */
	async read(serviceUUID: string, charUUID: string): Promise<Buffer> {
		if (!this.connectedDevice) {
			throw new BleError(
				BleErrorType.DEVICE_DISCONNECTED,
				'Device not connected'
			);
		}

		try {
			const char = await this.connectedDevice.readCharacteristicForService(
				serviceUUID,
				charUUID
			);

			if (!char.value) {
				throw new BleError(
					BleErrorType.READ_FAILED,
					'Empty characteristic value'
				);
			}

			return Buffer.from(char.value, 'base64');
		} catch (error: any) {
			const message = error?.message?.toLowerCase() || '';
			if (message.includes('characteristic') && message.includes('not found')) {
				throw new BleError(
					BleErrorType.CHARACTERISTIC_NOT_FOUND,
					'Characteristic not found',
					error
				);
			} else if (message.includes('service') && message.includes('not found')) {
				throw new BleError(
					BleErrorType.SERVICE_NOT_FOUND,
					'Service not found',
					error
				);
			} else {
				throw new BleError(BleErrorType.READ_FAILED, 'Read failed', error);
			}
		}
	}

	/**
	 * 开始监听 notify / indicate
	 * 监听必须在设备已连接、服务已发现之后调用
	 */
	monitor(
		serviceUUID: string,
		charUUID: string,
		onData: (data: Buffer) => void
	): void {
		if (!this.connectedDevice) {
			throw new BleError(
				BleErrorType.DEVICE_DISCONNECTED,
				'Device not connected'
			);
		}

		const key = `${serviceUUID}-${charUUID}`;

		// 防止重复监听同一个 characteristic
		if (this.monitorSubscriptions.has(key)) {
			this.monitorSubscriptions.get(key)?.remove();
			this.monitorSubscriptions.delete(key);
		}

		try {
			const subscription = this.connectedDevice.monitorCharacteristicForService(
				serviceUUID,
				charUUID,
				(error, characteristic) => {
					// 原生错误只记录，不抛出，避免 JS 崩溃
					if (error) {
						console.error(`[BleLib] Monitor error for ${key}:`, error);
						return;
					}

					if (characteristic?.value) {
						onData(Buffer.from(characteristic.value, 'base64'));
					}
				}
			);

			this.monitorSubscriptions.set(key, subscription);
		} catch (error: any) {
			const message = error?.message?.toLowerCase() || '';
			if (message.includes('characteristic') && message.includes('not found')) {
				throw new BleError(
					BleErrorType.CHARACTERISTIC_NOT_FOUND,
					'Characteristic not found',
					error
				);
			} else if (message.includes('service') && message.includes('not found')) {
				throw new BleError(
					BleErrorType.SERVICE_NOT_FOUND,
					'Service not found',
					error
				);
			} else {
				throw new BleError(BleErrorType.UNKNOWN, 'Monitor failed', error);
			}
		}
	}

	/**
	 * 主动关闭 notify
	 * 有些设备在断连前不关闭 notify 会导致下次连接闪退
	 */
	private async disableNotify(
		serviceUUID: string,
		charUUID: string
	): Promise<void> {
		if (!this.connectedDevice) return;

		try {
			// 向 CCCD 写 0x0000
			await this.connectedDevice.writeCharacteristicWithResponseForService(
				serviceUUID,
				charUUID,
				Buffer.from([0x00, 0x00]).toString('base64')
			);
		} catch {
			// 并非所有设备都允许手动关闭 CCCD
		}
	}

	/**
	 * 停止监听
	 * 可以指定某一个 characteristic
	 * 也可以全部停止
	 */
	async stopMonitor(serviceUUID?: string, charUUID?: string): Promise<void> {
		if (serviceUUID && charUUID) {
			const key = `${serviceUUID}-${charUUID}`;

			await this.disableNotify(serviceUUID, charUUID);

			this.monitorSubscriptions.get(key)?.remove();
			this.monitorSubscriptions.delete(key);
			return;
		}

		// 全量关闭
		for (const key of this.monitorSubscriptions.keys()) {
			const [s, c] = key.split('-');
			await this.disableNotify(s, c);
		}

		this.monitorSubscriptions.forEach((sub) => {
			try {
				sub.remove();
			} catch {}
		});

		this.monitorSubscriptions.clear();
	}

	/**
	 * 断开设备连接
	 * 顺序非常关键
	 */
	async disconnect(): Promise<void> {
		const device = this.connectedDevice;

		// 先清内部状态，避免并发操作
		this.connectedDevice = null;

		// 必须先停止所有监听
		await this.stopMonitor();

		// 给 native 一点时间处理 unsubscribe
		await new Promise((r) => setTimeout(r, 300));

		if (device) {
			try {
				await device.cancelConnection();
			} catch {
				// 已断开时 cancelConnection 可能抛错
			}
		}
	}

	/**
	 * 强制清理所有 BLE 状态
	 * 用于页面退出或 fatal 错误恢复
	 */
	async forceCleanup(): Promise<void> {
		console.log('[BleService] 强制清理 BLE 状态');

		// 停止扫描
		try {
			await this.manager.stopDeviceScan();
		} catch {
			// 忽略停止扫描的错误
		}

		// 断开连接
		if (this.connectedDevice) {
			try {
				await this.connectedDevice.cancelConnection();
			} catch {
				// 忽略断开连接的错误
			}
		}

		// 停止所有监听
		this.monitorSubscriptions.forEach((sub) => {
			try {
				sub.remove();
			} catch {}
		});

		// 重置内部状态
		this.connectedDevice = null;
		this.monitorSubscriptions.clear();

		// 等待 native 层清理完成
		await new Promise((r) => setTimeout(r, 1000));

		console.log('[BleService] BLE 状态清理完成');
	}

	/**
	 * 销毁并重建 manager
	 * 只在应用级重置或 fatal 错误后使用
	 */
	destroyManager(): void {
		try {
			this.manager.destroy();
		} catch {}

		this.manager = new BleManager();
	}

	/** 获取当前连接的设备 */
	getConnectedDevice(): Device | null {
		return this.connectedDevice;
	}
}

export default BleService.getInstance();
