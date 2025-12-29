import Card from '@/components/ui/card';
import RadioSelect, { SelectOption } from '@/components/ui/radio-select';
import TopTitle from '@/components/ui/top-title';
import { Stack } from 'expo-router';
import { Globe } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import i18n from '../../../i18n';

const languageOptions: SelectOption[] = [
	{ id: 'zh', title: '中文' },
	{ id: 'en', title: 'English' },
];

export default function LanguagePage() {
	const { t } = useTranslation();
	const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

	useEffect(() => {
		const handleLanguageChange = (lng: string) => {
			setCurrentLanguage(lng);
		};

		i18n.on('languageChanged', handleLanguageChange);

		return () => {
			i18n.off('languageChanged', handleLanguageChange);
		};
	}, []);

	const handleLanguageChange = async (languageCode: string) => {
		await i18n.changeLanguage(languageCode);
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<TopTitle
				title={t('settings-app-setting-language-title')}
				showBack={true}
			/>
			<View className="flex-1 bg-gray-100 px-4 pt-4 dark:bg-black">
				<Card
					variant="elevated"
					title={t('settings-app-setting-language-change-title')}
					icon={<Globe size={18} />}
				>
					<RadioSelect
						options={languageOptions}
						selectedId={currentLanguage}
						onSelect={handleLanguageChange}
					/>
				</Card>
			</View>
		</>
	);
}
