import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { translations } from '../lib/translations';

type Language = 'en' | 'id';
type TranslationKey = keyof typeof translations.en;

interface SettingsContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const SETTINGS_STORAGE_KEY = 'gemini-app-settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                const settings = JSON.parse(storedSettings);
                return settings.language === 'id' ? 'id' : 'en';
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage', error);
        }
        return 'en'; // Default language
    });

    useEffect(() => {
        try {
            const settings = { language };
            window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings to localStorage', error);
        }
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = useCallback((key: TranslationKey, substitutions?: Record<string, string | number>): string => {
        let translation = translations[language][key] || translations.en[key];
        
        if (substitutions) {
            Object.entries(substitutions).forEach(([subKey, value]) => {
                translation = translation.replace(`{{${subKey}}}`, String(value));
            });
        }

        return translation;
    }, [language]);

    return (
        <SettingsContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
