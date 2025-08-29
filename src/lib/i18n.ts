import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Import English translations (fallback)
import enCommon from '../locales/en/common.json';
import enNavigation from '../locales/en/navigation.json';
import enFolders from '../locales/en/folders.json';
import enActions from '../locales/en/actions.json';
import enDashboard from '../locales/en/dashboard.json';
import enMedia from '../locales/en/media.json';
import enHistory from '../locales/en/history.json';
import enActivity from '../locales/en/activity.json';
import enAuth from '../locales/en/auth.json';
import enErrors from '../locales/en/errors.json';

// Import Spanish translations
import esCommon from '../locales/es/common.json';
import esNavigation from '../locales/es/navigation.json';
import esFolders from '../locales/es/folders.json';

// Available languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

// Language resources
const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    folders: enFolders,
    actions: enActions,
    dashboard: enDashboard,
    media: enMedia,
    history: enHistory,
    activity: enActivity,
    auth: enAuth,
    errors: enErrors
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    folders: esFolders,
    // TODO: Add remaining Spanish translations
    actions: enActions, // Fallback to English
    dashboard: enDashboard,
    media: enMedia,
    history: enHistory,
    activity: enActivity,
    auth: enAuth,
    errors: enErrors
  },
  // TODO: Add other languages
  fr: {
    common: enCommon, // Fallback to English for now
    navigation: enNavigation,
    folders: enFolders,
    actions: enActions,
    dashboard: enDashboard,
    media: enMedia,
    history: enHistory,
    activity: enActivity,
    auth: enAuth,
    errors: enErrors
  },
  de: {
    common: enCommon, // Fallback to English for now
    navigation: enNavigation,
    folders: enFolders,
    actions: enActions,
    dashboard: enDashboard,
    media: enMedia,
    history: enHistory,
    activity: enActivity,
    auth: enAuth,
    errors: enErrors
  },
  zh: {
    common: enCommon, // Fallback to English for now
    navigation: enNavigation,
    folders: enFolders,
    actions: enActions,
    dashboard: enDashboard,
    media: enMedia,
    history: enHistory,
    activity: enActivity,
    auth: enAuth,
    errors: enErrors
  },
  ja: {
    common: enCommon, // Fallback to English for now
    navigation: enNavigation,
    folders: enFolders,
    actions: enActions,
    dashboard: enDashboard,
    media: enMedia,
    history: enHistory,
    activity: enActivity,
    auth: enAuth,
    errors: enErrors
  }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'folders', 'actions', 'dashboard', 'media', 'history', 'activity', 'auth', 'errors'],
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false
    },
    
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development'
  });

export default i18n;