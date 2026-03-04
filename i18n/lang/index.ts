import en from './en.json';
import zh from './zh.json';

export const resources = {
	en: { translation: en },
	zh: { translation: zh },
} as const;

export type AppResource = typeof resources;
export type LanguageCode = keyof AppResource;
