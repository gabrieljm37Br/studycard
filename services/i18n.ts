import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptCommon from '../locales/pt/common.json';
import ptNav from '../locales/pt/nav.json';
import ptTopbar from '../locales/pt/topbar.json';
import ptBanner from '../locales/pt/banner.json';
import ptDashboard from '../locales/pt/dashboard.json';
import ptStudy from '../locales/pt/study.json';

import enCommon from '../locales/en/common.json';
import enNav from '../locales/en/nav.json';
import enTopbar from '../locales/en/topbar.json';
import enBanner from '../locales/en/banner.json';
import enDashboard from '../locales/en/dashboard.json';
import enStudy from '../locales/en/study.json';

import esCommon from '../locales/es/common.json';
import esNav from '../locales/es/nav.json';
import esTopbar from '../locales/es/topbar.json';
import esBanner from '../locales/es/banner.json';
import esDashboard from '../locales/es/dashboard.json';
import esStudy from '../locales/es/study.json';

export const resources = {
    pt: {
        common: ptCommon,
        nav: ptNav,
        topbar: ptTopbar,
        banner: ptBanner,
        dashboard: ptDashboard,
        study: ptStudy
    },
    en: {
        common: enCommon,
        nav: enNav,
        topbar: enTopbar,
        banner: enBanner,
        dashboard: enDashboard,
        study: enStudy
    },
    es: {
        common: esCommon,
        nav: esNav,
        topbar: esTopbar,
        banner: esBanner,
        dashboard: esDashboard,
        study: esStudy
    }
} as const;

export type SupportedLanguage = 'pt' | 'en' | 'es';

export interface LanguageOption {
    code: SupportedLanguage;
    label: string;
    flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' }
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt';
export const LANGUAGE_STORAGE_KEY = 'studycard_language';

export function normalizeLanguageCode(lang?: string | null): SupportedLanguage {
    if (!lang) return DEFAULT_LANGUAGE;
    const lower = lang.toLowerCase();
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('es')) return 'es';
    return 'pt';
}

export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
    await i18n.changeLanguage(lang);
}

export function getCurrentLanguage(): SupportedLanguage {
    const raw = (i18n && i18n.language)
        || (typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null)
        || DEFAULT_LANGUAGE;
    return normalizeLanguageCode(raw);
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: ['pt', 'en', 'es'],
        defaultNS: 'common',
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: LANGUAGE_STORAGE_KEY,
            caches: ['localStorage']
        },
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
