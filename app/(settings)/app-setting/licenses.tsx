import licensesData from '@/assets/licenses.json';
import TopTitle from '@/components/ui/top-title';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 适配 license-report 的数据结构
 * 如果你的 JSON 已经是 [{name: '...', ...}]，直接使用
 * 如果是对象结构，保留 Object.keys 逻辑
 */
const formattedLicenses = Array.isArray(licensesData)
	? licensesData
	: Object.keys(licensesData).map((key) => {
			const item = (licensesData as any)[key];
			return {
				name: item.name || key.split('@')[0],
				installedVersion: item.installedVersion || key.split('@')[1],
				licenseType: item.licenseType || item.licenses || 'Unknown',
				author: item.author || item.publisher || item.email || 'Unknown',
				link: item.link || item.repository || '',
			};
		});

export default function LicensesScreen() {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-app-setting-licenses-title')}
				showBack={true}
			/>
			<View className="flex-1 bg-gray-50 dark:bg-black">
				<FlashList
					data={formattedLicenses}
					keyExtractor={(item: any, index) => item.name + index}
					contentContainerStyle={{
						paddingVertical: 12,
						paddingBottom: insets.bottom,
					}}
					renderItem={({ item }: any) => (
						<View className="mx-4 mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
							{/* 包名与协议标签 */}
							<View className="mb-3 flex-row items-center justify-between">
								<Text
									className="flex-1 text-lg font-bold text-gray-900 dark:text-white"
									numberOfLines={1}
								>
									{item.name}
								</Text>
								<View className="ml-2 rounded-full bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
									<Text className="text-[10px] font-bold text-blue-600 dark:text-blue-300">
										{item.licenseType || item.license}
									</Text>
								</View>
							</View>

							{/* 详情信息 */}
							<View className="space-y-1">
								<Text className="text-xs text-gray-500 dark:text-gray-400">
									Version:{' '}
									<Text className="text-gray-700 dark:text-gray-200">
										{item.installedVersion || item.version}
									</Text>
								</Text>
								<Text
									className="text-xs text-gray-500 dark:text-gray-400"
									numberOfLines={1}
								>
									Author:{' '}
									<Text className="text-gray-700 dark:text-gray-200">
										{item.author || item.publisher}
									</Text>
								</Text>
							</View>

							{/* 链接（如果有） */}
							{(item.link || item.repository) && (
								<TouchableOpacity
									className="mt-3 border-t border-gray-50 pt-2 dark:border-gray-800"
									onPress={() => {
										const url = (item.link || item.repository)
											.replace('git+', '')
											.replace('.git', '');
										Linking.openURL(url).catch(() => {});
									}}
								>
									<Text
										className="text-[10px] text-blue-500 underline"
										numberOfLines={1}
									>
										{item.link || item.repository}
									</Text>
								</TouchableOpacity>
							)}
						</View>
					)}
				/>
			</View>
		</>
	);
}
