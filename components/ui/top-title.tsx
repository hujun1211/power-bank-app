import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Ellipsis } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopTitleProps {
	title: string;
	showBack?: boolean;
	rightContent?: React.ReactNode;
	backgroundColor?: string;
	showMoreMenu?: boolean;
	menuOptions?: {
		label: string;
		icon?: React.ReactNode;
		onPress: () => void;
	}[];
}

export default function TopTitle({
	title,
	showBack = true,
	rightContent,
	backgroundColor = 'bg-white',
	showMoreMenu = false,
	menuOptions = [],
}: TopTitleProps) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isMenuVisible, setIsMenuVisible] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;

	// 控制返回按钮和更多按钮的动画值
	const backPressAnim = useRef(new Animated.Value(0)).current;
	const morePressAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (isMenuOpen) {
			setIsMenuVisible(true);
			fadeAnim.setValue(0);
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
		} else {
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}).start(() => {
				setIsMenuVisible(false);
			});
		}
	}, [isMenuOpen, fadeAnim]);

	// 动画触发函数
	const animatePress = (anim: Animated.Value, toValue: number) => {
		Animated.timing(anim, {
			toValue,
			duration: toValue === 1 ? 100 : 200, // 按下快，松开稍慢
			useNativeDriver: true,
		}).start();
	};

	const handleMenuItemPress = (onPress: () => void) => {
		setIsMenuOpen(false);
		onPress();
	};

	return (
		<>
			{isMenuVisible && (
				<Animated.View
					className="absolute bottom-0 left-0 right-0 top-0 z-40 bg-black"
					style={{
						opacity: fadeAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [0, 0.2],
						}),
					}}
					pointerEvents="auto"
				>
					<Pressable
						onPress={() => setIsMenuOpen(false)}
						className="h-full w-full"
					/>
				</Animated.View>
			)}

			{isMenuVisible && menuOptions.length > 0 && (
				<Animated.View
					className="absolute right-4 z-50 min-w-40 rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-600 dark:bg-gray-800"
					style={{
						top: insets.top + 50,
						opacity: fadeAnim,
					}}
					pointerEvents="auto"
				>
					{menuOptions.map((option, index) => (
						<Pressable
							key={index}
							onPress={() => handleMenuItemPress(option.onPress)}
							android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
							className={`flex-row items-center gap-2 px-4 py-2 ${
								index !== menuOptions.length - 1
									? 'border-b border-gray-100 dark:border-gray-600'
									: ''
							}`}
						>
							{({ pressed }) => (
								<>
									{/* 菜单项点击过渡 */}
									{pressed && (
										<View className="absolute inset-0 bg-black/5 dark:bg-white/5" />
									)}
									{option.icon && (
										<View className="flex-shrink-0">
											{React.isValidElement(option.icon)
												? React.cloneElement(
														option.icon as React.ReactElement<{
															color: string;
														}>,
														{
															color:
																colorScheme === 'dark' ? '#d1d5db' : '#374151',
														}
													)
												: option.icon}
										</View>
									)}
									<Text className="text-base text-gray-800 dark:text-gray-200">
										{option.label}
									</Text>
								</>
							)}
						</Pressable>
					))}
				</Animated.View>
			)}

			<View
				className={`absolute left-0 right-0 top-0 z-50 flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900 ${backgroundColor}`}
				style={{ paddingTop: insets.top }}
			>
				<View className="flex-1 flex-row items-center justify-start gap-3">
					{showBack && (
						<Pressable
							onPress={() => router.back()}
							onPressIn={() => animatePress(backPressAnim, 1)}
							onPressOut={() => animatePress(backPressAnim, 0)}
							className="relative items-center justify-center"
							android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
						>
							<Animated.View
								className="absolute inset-0 rounded-full bg-gray-200/60 dark:bg-gray-700/60"
								style={{
									opacity: backPressAnim,
									transform: [{ scale: 1.6 }],
								}}
							/>
							<ArrowLeft
								size={24}
								color={colorScheme === 'dark' ? 'white' : 'black'}
							/>
						</Pressable>
					)}
					<Text className="text-xl font-bold text-black dark:text-white">
						{title}
					</Text>
				</View>

				<View className="flex-row items-center justify-end gap-2">
					{rightContent && (
						<View className="flex-row items-center gap-2">{rightContent}</View>
					)}
					{showMoreMenu && (
						<Pressable
							onPress={() => setIsMenuOpen(!isMenuOpen)}
							onPressIn={() => animatePress(morePressAnim, 1)}
							onPressOut={() => animatePress(morePressAnim, 0)}
							className="relative h-10 w-10 items-center justify-center"
							android_ripple={{
								color: 'rgba(0, 0, 0, 0.1)',
								borderless: true,
							}}
						>
							<Animated.View
								className="absolute inset-0 rounded-full bg-gray-200/60 dark:bg-gray-700/60"
								style={{
									opacity: morePressAnim,
									transform: [{ scale: 1.2 }],
								}}
							/>
							<Ellipsis
								size={24}
								color={colorScheme === 'dark' ? 'white' : 'black'}
							/>
						</Pressable>
					)}
				</View>
			</View>
			<View style={{ height: insets.top + 30 }} />
		</>
	);
}
