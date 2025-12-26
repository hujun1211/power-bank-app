import {
	BleManager,
	Device,
	Characteristic,
	Subscription,
} from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

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
			const device = await this.manager.connectToDevice(deviceId);

			this.connectedDevice = device;

			// 必须先发现服务和特征，否则后续 monitor/read/write 会随机失败
			await device.discoverAllServicesAndCharacteristics();

			// Android 下提升 MTU，失败也不影响主流程
			if (Platform.OS === 'android') {
				try {
					await device.requestMTU(512);
				} catch {
					// 某些设备不支持 requestMTU
				}
			}

			return device;
		} catch (error) {
			// 连接失败时确保内部状态干净
			this.connectedDevice = null;
			throw error;
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
			throw new Error('Device not connected');
		}

		// 1. 统一构建 Buffer
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
		} catch (error) {
			console.error(`[BleLib] 写入失败:`, error);
			throw error;
		}
	}

	/**
	 * 读取一次特征值
	 */
	async read(serviceUUID: string, charUUID: string): Promise<Buffer> {
		if (!this.connectedDevice) {
			throw new Error('Device not connected');
		}

		const char = await this.connectedDevice.readCharacteristicForService(
			serviceUUID,
			charUUID
		);

		if (!char.value) {
			throw new Error('Empty characteristic value');
		}

		return Buffer.from(char.value, 'base64');
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
			throw new Error('Device not connected');
		}

		const key = `${serviceUUID}-${charUUID}`;

		// 防止重复监听同一个 characteristic
		if (this.monitorSubscriptions.has(key)) {
			this.monitorSubscriptions.get(key)?.remove();
			this.monitorSubscriptions.delete(key);
		}

		const subscription = this.connectedDevice.monitorCharacteristicForService(
			serviceUUID,
			charUUID,
			(error, characteristic) => {
				// 原生错误只记录，不抛出，避免 JS 崩溃
				if (error) {
					return;
				}

				if (characteristic?.value) {
					onData(Buffer.from(characteristic.value, 'base64'));
				}
			}
		);

		this.monitorSubscriptions.set(key, subscription);
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
	 * 销毁并重建 manager
	 * 只在应用级重置或 fatal 错误后使用
	 */
	async destroyManager(): Promise<void> {
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
