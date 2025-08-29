import React, { createContext, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../lib/i18n';

interface I18nContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  isRTL: boolean;
  formatMessage: (key: string, options?: any) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

// RTL languages
const RTL_LANGUAGES: SupportedLanguage[] = []; // Add RTL languages here if needed (e.g., 'ar', 'he')

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );

  const changeLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Update document direction for RTL languages
      const isRTL = RTL_LANGUAGES.includes(language);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      
      // Save to localStorage
      localStorage.setItem('i18nextLng', language);
      
      console.log(`Language changed to: ${language}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n]);

  const formatMessage = useCallback((key: string, options?: any) => {
    return t(key, options) as string;
  }, [t]);

  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  const contextValue: I18nContextType = {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL,
    formatMessage
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

