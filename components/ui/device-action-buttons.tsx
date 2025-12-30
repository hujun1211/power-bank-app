import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
				<Pressable
					className={`items-center rounded-lg p-4 ${primaryButton.backgroundColor}`}
					android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
					onPress={primaryButton.onPress}
				>
					<Text className="text-base font-semibold text-white">
						{primaryButton.label}
					</Text>
				</Pressable>
			)}

			{showSecondary && secondaryButton && (
				<Pressable
					className={`items-center rounded-lg p-4 ${secondaryButton.backgroundColor} ${secondaryButton.disabled ? 'opacity-50' : ''}`}
					android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
					onPress={secondaryButton.onPress}
					disabled={secondaryButton.disabled}
				>
					<Text className="text-base font-semibold text-white">
						{secondaryButton.label}
					</Text>
				</Pressable>
			)}
		</View>
	);
}
