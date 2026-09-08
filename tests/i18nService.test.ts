import { describe, it, expect, beforeEach } from 'vitest';
import i18n, {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    LANGUAGE_STORAGE_KEY,
    normalizeLanguageCode,
    changeLanguage,
    getCurrentLanguage,
    resources
} from '../services/i18n';

describe('i18n Service - Internacionalização (PT, EN, ES)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('deve ter o Português como idioma padrão e de fallback', () => {
        expect(DEFAULT_LANGUAGE).toBe('pt');
        expect(i18n.options.fallbackLng).toContain('pt');
    });

    it('deve suportar os 3 idiomas: pt, en e es', () => {
        const codes = SUPPORTED_LANGUAGES.map(lang => lang.code);
        expect(codes).toEqual(['pt', 'en', 'es']);
    });

    it('deve normalizar códigos de idioma corretamente', () => {
        expect(normalizeLanguageCode(null)).toBe('pt');
        expect(normalizeLanguageCode(undefined)).toBe('pt');
        expect(normalizeLanguageCode('')).toBe('pt');
        expect(normalizeLanguageCode('en-US')).toBe('en');
        expect(normalizeLanguageCode('EN')).toBe('en');
        expect(normalizeLanguageCode('es-ES')).toBe('es');
        expect(normalizeLanguageCode('ES')).toBe('es');
        expect(normalizeLanguageCode('pt-BR')).toBe('pt');
        expect(normalizeLanguageCode('fr-FR')).toBe('pt'); // fallback
    });

    it('deve alternar o idioma e persistir no localStorage', async () => {
        await changeLanguage('en');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
        expect(getCurrentLanguage()).toBe('en');

        await changeLanguage('es');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
        expect(getCurrentLanguage()).toBe('es');

        // Retornar para pt
        await changeLanguage('pt');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt');
        expect(getCurrentLanguage()).toBe('pt');
    });

    it('deve conter todos os namespaces essenciais em todos os idiomas suportados', () => {
        const namespaces = ['common', 'nav', 'topbar', 'banner', 'dashboard', 'study'] as const;

        for (const lang of ['pt', 'en', 'es'] as const) {
            const langResources = resources[lang];
            expect(langResources).toBeDefined();

            for (const ns of namespaces) {
                expect(langResources[ns]).toBeDefined();
                expect(Object.keys(langResources[ns]).length).toBeGreaterThan(0);
            }
        }
    });

    it('deve traduzir chaves correspondentes nos namespaces carregados', async () => {
        await changeLanguage('pt');
        expect(i18n.t('nav:dashboard')).toBe('Dashboard');
        expect(i18n.t('common:save')).toBe('Salvar');

        await changeLanguage('en');
        expect(i18n.t('common:save')).toBe('Save');
        expect(i18n.t('nav:home')).toBe('Home');

        await changeLanguage('es');
        expect(i18n.t('common:save')).toBe('Guardar');
        expect(i18n.t('nav:home')).toBe('Inicio');

        // Resetar para PT para não afetar outros testes
        await changeLanguage('pt');
    });
});
