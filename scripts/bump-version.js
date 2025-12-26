import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// 模拟 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 自动化版本管理脚本
 * 1. 递增 app.json 中的 expo.version (1.0.x -> 1.0.x+1)
 * 2. 递增 Android versionCode (整数 +1)
 * 3. 递增 iOS buildNumber (字符串整数 +1)
 * 4. 校验 assets/licenses.json 是否存在且有效
 */

const APP_JSON_PATH = path.join(__dirname, '../app.json');
const LICENSE_PATH = path.join(__dirname, '../assets/licenses.json');

function bumpVersion() {
	try {
		// --- 1. 基础校验：licenses.json ---
		if (!fs.existsSync(LICENSE_PATH)) {
			console.error(
				'❌ 错误: 未找到 assets/licenses.json。请先运行 npm run gen-license'
			);
			process.exit(1);
		}

		const licenses = JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'));
		if (!Array.isArray(licenses) || licenses.length === 0) {
			console.error('❌ 错误: licenses.json 为空或格式非法，构建终止。');
			process.exit(1);
		}
		console.log(`💡 检测到 ${licenses.length} 个开源许可依赖...`);

		// --- 2. 读取并解析 app.json ---
		const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
		const { expo } = appJson;

		if (!expo) {
			console.error('❌ 错误: app.json 中缺少 "expo" 字段。');
			process.exit(1);
		}

		console.log('--- 正在更新版本号 ---');

		// --- 3. 更新语义化版本 (Version Name: 1.0.0 -> 1.0.1) ---
		const oldVersion = expo.version || '1.0.0';
		const versionParts = oldVersion.split('.');
		if (versionParts.length === 3) {
			versionParts[2] = (parseInt(versionParts[2], 10) + 1).toString();
			expo.version = versionParts.join('.');
			console.log(`✅ Version: ${oldVersion} -> ${expo.version}`);
		}

		// --- 4. 更新 Android versionCode (必须是递增整数) ---
		if (!expo.android) expo.android = {};
		const oldVC = expo.android.versionCode || 0;
		expo.android.versionCode = oldVC + 1;
		console.log(
			`✅ Android versionCode: ${oldVC} -> ${expo.android.versionCode}`
		);

		// --- 5. 更新 iOS buildNumber (字符串整数) ---
		if (!expo.ios) expo.ios = {};
		const oldBN = expo.ios.buildNumber || '0';
		expo.ios.buildNumber = (parseInt(oldBN, 10) + 1).toString();
		console.log(`✅ iOS buildNumber: ${oldBN} -> ${expo.ios.buildNumber}`);

		// --- 6. 保存修改 ---
		fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 3));
		console.log('--- ✨ 版本递增成功！ ---');
	} catch (error) {
		console.error('❌ 脚本运行出错:', error.message);
		process.exit(1);
	}
}

bumpVersion();
