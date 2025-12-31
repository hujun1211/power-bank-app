import React, { useRef } from 'react';
import {
	Animated,
	Pressable,
	PressableProps,
	StyleProp,
	Text,
	View,
	ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DarkenPressableProps extends PressableProps {
	className?: string;
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
}

const DarkenPressable = ({
	children,
	className,
	style,
	disabled,
	...props
}: DarkenPressableProps) => {
	const opacityAnim = useRef(new Animated.Value(0)).current;

	const fadeIn = () => {
		if (disabled) return;
		Animated.timing(opacityAnim, {
			toValue: 0.15,
			duration: 150,
			useNativeDriver: true,
		}).start();
	};

	const fadeOut = () => {
		Animated.timing(opacityAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start();
	};

	return (
		<Pressable
			onPressIn={fadeIn}
			onPressOut={fadeOut}
			disabled={disabled}
			className={`relative overflow-hidden ${className}`}
			style={style}
			{...props}
		>
			{children}

			<Animated.View
				pointerEvents="none"
				style={{
					position: 'absolute',
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					backgroundColor: 'black',
					opacity: opacityAnim,
				}}
			/>
		</Pressable>
	);
};

interface ActionButton {
	label: string;
	backgroundColor: string;
	onPress: () => void;
	disabled?: boolean;
}

interface DeviceActionButtonsProps {
	primaryButton?: ActionButton;
	secondaryButton?: ActionButton;
	showPrimary?: boolean;
	showSecondary?: boolean;
}

export default function DeviceActionButtons({
	primaryButton,
	secondaryButton,
	showPrimary = true,
	showSecondary = false,
}: DeviceActionButtonsProps) {
	const insets = useSafeAreaInsets();

	return (
		<View
			className="gap-3 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-black"
			style={{ paddingBottom: insets.bottom + 12 }}
		>
			{showPrimary && primaryButton && (
				<DarkenPressable
					className={`items-center rounded-lg p-4 ${primaryButton.backgroundColor} disabled:opacity-50`}
					android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
					onPress={primaryButton.onPress}
					disabled={primaryButton.disabled}
				>
					<Text className="text-base font-semibold text-white">
						{primaryButton.label}
					</Text>
				</DarkenPressable>
			)}

			{showSecondary && secondaryButton && (
				<DarkenPressable
					className={`items-center rounded-lg p-4 ${secondaryButton.backgroundColor} disabled:opacity-50`}
					android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
					onPress={secondaryButton.onPress}
					disabled={secondaryButton.disabled}
				>
					<Text className="text-base font-semibold text-white">
						{secondaryButton.label}
					</Text>
				</DarkenPressable>
			)}
		</View>
	);
}
