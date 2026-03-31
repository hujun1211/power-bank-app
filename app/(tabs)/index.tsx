import Banner from '@/components/home/banner';
import { Device } from '@/components/home/device';
import Header from '@/components/home/header';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

export default function HomeScreen() {
	const colorScheme = useColorScheme();

	const gradientColors: readonly [string, string, string] =
		colorScheme === 'dark'
			? ['#1F2937', '#374151', '#000000']
			: ['#FBBF24', '#FCD34D', '#ffffff'];

	return (
		<LinearGradient
			colors={gradientColors}
			locations={[0, 0.3, 1]}
			start={{ x: 0, y: 0 }}
			end={{ x: 0, y: 0.6 }}
			style={{ flex: 1 }}
		>
			<View className="flex-1">
				<Header />
				<View className="flex-shrink px-4">
					<Banner />
				</View>
				<View className="flex-1">
					<Device />
				</View>
			</View>
		</LinearGradient>
	);
}
