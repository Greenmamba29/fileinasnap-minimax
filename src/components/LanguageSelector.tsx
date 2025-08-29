import { useState } from 'react';
import { useI18n, useTranslate } from '../hooks/useI18nContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { colors } from '../lib/design-system';

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSelector({ className = '', compact = false }: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage, supportedLanguages } = useI18n();
  const t = useTranslate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode as any);
    setIsOpen(false);
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-1"
          title={t('common:language')}
        >
          <Globe size={18} color={colors.text.secondary} />
          <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>
            {currentLang?.flag}
          </span>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div 
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50"
              style={{ borderColor: colors.primary.lightGray }}
            >
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                      {lang.nativeName}
                    </span>
                  </div>
                  {currentLanguage === lang.code && (
                    <Check size={16} color={colors.primary.blue} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
        style={{ borderColor: colors.primary.lightGray }}
      >
        <Globe size={18} color={colors.text.secondary} />
        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
          {currentLang?.nativeName}
        </span>
        <ChevronDown 
          size={16} 
          color={colors.text.secondary}
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50"
            style={{ borderColor: colors.primary.lightGray }}
          >
            <div className="px-4 py-2 border-b" style={{ borderColor: colors.primary.lightGray }}>
              <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                {t('common:language')}
              </h3>
            </div>
            
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{lang.flag}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                      {lang.nativeName}
                    </p>
                    <p className="text-xs" style={{ color: colors.text.secondary }}>
                      {lang.name}
                    </p>
                  </div>
                </div>
                {currentLanguage === lang.code && (
                  <Check size={18} color={colors.primary.blue} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}