import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
	Animated,
	Dimensions,
	Easing,
	Keyboard,
	Modal,
	Platform,
	Pressable,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

interface BottomModalProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	showCloseButton?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomModal({
	visible,
	onClose,
	title,
	children,
	showCloseButton = true,
}: BottomModalProps) {
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [showModal, setShowModal] = useState(visible);
	const animValue = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			setShowModal(true);
			Animated.timing(animValue, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
				easing: Easing.out(Easing.cubic),
			}).start();
		} else {
			Animated.timing(animValue, {
				toValue: 0,
				duration: 400,
				useNativeDriver: true,
				easing: Easing.in(Easing.cubic),
			}).start(() => {
				setShowModal(false);
			});
		}
	}, [visible, animValue]);

	useEffect(() => {
		const showListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(e) => setKeyboardHeight(e.endCoordinates.height)
		);
		const hideListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => setKeyboardHeight(0)
		);
		return () => {
			showListener.remove();
			hideListener.remove();
		};
	}, []);

	const backdropOpacity = animValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 0.5],
	});

	const slideY = animValue.interpolate({
		inputRange: [0, 1],
		outputRange: [SCREEN_HEIGHT, 0],
	});

	return (
		<Modal
			visible={showModal}
			transparent={true}
			animationType="none"
			onRequestClose={onClose}
		>
			<Animated.View
				style={{
					position: 'absolute',
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					backgroundColor: 'black',
					opacity: backdropOpacity,
				}}
			>
				<Pressable style={{ flex: 1 }} onPress={onClose} />
			</Animated.View>

			<View
				style={{
					flex: 1,
					justifyContent: 'flex-end',
					paddingBottom: keyboardHeight,
				}}
				pointerEvents="box-none"
			>
				<Animated.View
					style={{
						transform: [{ translateY: slideY }],
					}}
				>
					<Pressable onPress={() => {}}>
						<TouchableWithoutFeedback>
							<View className="w-full rounded-t-3xl bg-white p-6 pb-8 shadow-2xl dark:bg-gray-900">
								{title && (
									<View className="mb-4 flex-row items-center justify-between">
										<Text className="text-xl font-bold text-gray-900 dark:text-white">
											{title}
										</Text>
										{showCloseButton && (
											<TouchableOpacity onPress={onClose} className="p-2">
												<X size={24} color="#9CA3AF" />
											</TouchableOpacity>
										)}
									</View>
								)}
								{children}
							</View>
						</TouchableWithoutFeedback>
					</Pressable>
				</Animated.View>
			</View>
		</Modal>
	);
}
