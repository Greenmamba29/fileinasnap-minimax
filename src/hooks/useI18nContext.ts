import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nContext } from '../context/I18nContext';

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook for easy translation access
export function useTranslate() {
  const { t } = useTranslation();
  return t;
}
