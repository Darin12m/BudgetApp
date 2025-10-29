import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import mkTranslation from './locales/mk/translation.json';

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      mk: {
        translation: mkTranslation,
      },
    },
    fallbackLng: 'en', // Fallback language if detection fails
    debug: false, // Set to true for debugging
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'], // Order of language detection
      caches: ['localStorage'], // Cache detected language
    },
  });

export default i18n;