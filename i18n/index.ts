import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
	default as i18n,
	default as i18next,
	LanguageDetectorAsyncModule,
} from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './lang';

const STORAGE_KEY = 'app_language';

const languageDetector: LanguageDetectorAsyncModule = {
	type: 'languageDetector',
	async: true,
	detect: async () => {
		try {
			const saved = await AsyncStorage.getItem(STORAGE_KEY);
			if (saved) return saved;

			const locales = Localization.getLocales();
			return locales[0]?.languageCode ?? 'en';
		} catch {
			return 'en';
		}
	},
	init: () => {},
	cacheUserLanguage: async (lng: string) => {
		await AsyncStorage.setItem(STORAGE_KEY, lng);
	},
};

i18next
	.use(languageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: 'en',
		interpolation: { escapeValue: false },
		compatibilityJSON: 'v4',
	});

export default i18n;
