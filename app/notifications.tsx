import TopTitle from '@/components/ui/top-title';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Reanimated, {
	interpolate,
	SharedValue,
	useAnimatedStyle,
} from 'react-native-reanimated';

interface RightActionsProps {
	progress: SharedValue<number>;
	onDelete: () => void;
	deleteLabel: string;
}

function RightActions({ progress, onDelete, deleteLabel }: RightActionsProps) {
	const animatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(progress.value, [0, 1], [0, 1]);
		return {
			opacity,
		};
	});

	return (
		<Reanimated.View
			style={[{ width: 100, height: '100%', paddingLeft: 8 }, animatedStyle]}
		>
			<Pressable
				onPress={onDelete}
				className="h-full items-center justify-center rounded-lg bg-red-500 px-4"
			>
				<Text className="font-medium text-white">{deleteLabel}</Text>
			</Pressable>
		</Reanimated.View>
	);
}

interface Notification {
	id: string;
	title: string;
	description: string;
	time: string;
	type: 'info' | 'warning' | 'success';
}

const mockNotifications: Notification[] = [
	{
		id: '1',
		title: '充电完成',
		description: '您的充电宝已充满电，可以使用了',
		time: '2 小时前',
		type: 'success',
	},
	{
		id: '2',
		title: '低电量提醒',
		description: '您的便携电源电量已降至 20%，请及时充电',
		time: '4 小时前',
		type: 'warning',
	},
	{
		id: '3',
		title: '系统更新',
		description: '新版本已推出，点击更新获得更多功能',
		time: '1 天前',
		type: 'info',
	},
	{
		id: '4',
		title: '设备已连接',
		description: '新设备 便携电源 已成功连接',
		time: '2 天前',
		type: 'success',
	},
];

function getBackgroundColor(
	type: string,
	colorScheme: string | null | undefined
): string {
	const scheme = colorScheme || 'light';
	if (scheme === 'dark') {
		switch (type) {
			case 'success':
				return 'bg-green-700/40';
			case 'warning':
				return 'bg-yellow-700/40';
			case 'info':
				return 'bg-blue-700/40';
			default:
				return 'bg-gray-600';
		}
	} else {
		switch (type) {
			case 'success':
				return 'bg-green-50';
			case 'warning':
				return 'bg-yellow-50';
			case 'info':
				return 'bg-blue-50';
			default:
				return 'bg-gray-50';
		}
	}
}

function getBorderColor(
	type: string,
	colorScheme: string | null | undefined
): string {
	const scheme = colorScheme || 'light';
	if (scheme === 'dark') {
		switch (type) {
			case 'success':
				return 'border-l-4 border-green-600';
			case 'warning':
				return 'border-l-4 border-yellow-600';
			case 'info':
				return 'border-l-4 border-blue-600';
			default:
				return 'border-l-4 border-gray-600';
		}
	} else {
		switch (type) {
			case 'success':
				return 'border-l-4 border-green-400';
			case 'warning':
				return 'border-l-4 border-yellow-400';
			case 'info':
				return 'border-l-4 border-blue-400';
			default:
				return 'border-l-4 border-gray-400';
		}
	}
}

export default function NotificationsPage() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation();
	const colorScheme = useColorScheme();
	const [activeTab, setActiveTab] = useState<
		'all' | 'system' | 'device' | 'promotion'
	>('all');
	const [notifications, setNotifications] = useState(mockNotifications);
	const [fadeAnims, setFadeAnims] = useState<{ [key: string]: Animated.Value }>(
		{}
	);

	const deleteNotification = (id: string) => {
		const anim = fadeAnims[id] || new Animated.Value(1);
		Animated.timing(anim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			setNotifications((prev) =>
				prev.filter((notification) => notification.id !== id)
			);
		});
		setFadeAnims((prev) => ({ ...prev, [id]: anim }));
	};

	const tabs = [
		{ id: 'all', label: t('notification-tab-all'), key: 'all' as const },
		{
			id: 'system',
			label: t('notification-tab-system'),
			key: 'system' as const,
		},
		{
			id: 'device',
			label: t('notification-tab-device'),
			key: 'device' as const,
		},
		{
			id: 'promotion',
			label: t('notification-tab-promotion'),
			key: 'promotion' as const,
		},
	];

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle title={t('notification-header-title')} showBack={true} />
			<View className="flex-1 bg-white dark:bg-black">
				<View className="px-4 py-3">
					{/* 分类选项卡 */}
					<View className="flex-row gap-2">
						{tabs.map((tab) => (
							<Pressable
								key={tab.id}
								onPress={() => setActiveTab(tab.key)}
								className={` mt-2 flex-1 items-center justify-center rounded-full py-4 ${
									activeTab === tab.key
										? 'bg-yellow-300 dark:bg-yellow-600'
										: 'bg-gray-100 dark:bg-gray-800'
								}`}
							>
								<Text
									className={`text-sm font-medium ${
										activeTab === tab.key
											? 'text-black dark:text-white'
											: 'text-gray-600 dark:text-gray-300'
									}`}
								>
									{tab.label}
								</Text>
							</Pressable>
						))}
					</View>
				</View>
				<ScrollView className="flex-1 bg-white dark:bg-black">
					<View
						className="gap-3 p-4"
						style={{ paddingBottom: insets.bottom + 20 }}
					>
						{notifications.length > 0 ? (
							notifications.map((notification) => {
								const fadeAnim =
									fadeAnims[notification.id] || new Animated.Value(1);
								return (
									<View
										key={notification.id}
										className="overflow-hidden rounded-lg"
									>
										<ReanimatedSwipeable
											renderRightActions={(progress) => (
												<RightActions
													progress={progress}
													onDelete={() => deleteNotification(notification.id)}
													deleteLabel={t('notification-delete')}
												/>
											)}
											rightThreshold={40}
										>
											<Animated.View style={{ opacity: fadeAnim }}>
												<Pressable
													className={`rounded-lg p-4 ${getBackgroundColor(notification.type, colorScheme || 'light')} ${getBorderColor(notification.type, colorScheme || 'light')}`}
													onPress={() => {}}
												>
													<View className="flex-row items-start justify-between">
														<View className="flex-1">
															<Text className="mb-1 text-base font-bold text-black dark:text-white">
																{notification.title}
															</Text>
															<Text className="mb-2 text-sm text-gray-600 dark:text-gray-300">
																{notification.description}
															</Text>
															<Text className="text-xs text-gray-500 dark:text-gray-400">
																{notification.time}
															</Text>
														</View>
													</View>
												</Pressable>
											</Animated.View>
										</ReanimatedSwipeable>
									</View>
								);
							})
						) : (
							<View className="items-center justify-center py-12">
								<Text className="text-lg text-gray-500 dark:text-gray-400">
									暂无通知
								</Text>
							</View>
						)}
					</View>
				</ScrollView>
			</View>
		</>
	);
}
