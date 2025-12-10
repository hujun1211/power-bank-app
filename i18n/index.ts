import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as lang from "./lang";



const STORAGE_KEY = "app_language";

const languageDetector = {
  type: "languageDetector" as const,
  async: true,

  detect: async (callback: (lang: string) => void) => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        callback(saved);
        return;
      }

      const sysLang = Localization.getLocales()[0].languageCode;
      callback(sysLang || "en");
    } catch {
      callback("en");
    }
  },

  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    await AsyncStorage.setItem(STORAGE_KEY, lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: lang.en },
      zh: { translation: lang.zh },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
