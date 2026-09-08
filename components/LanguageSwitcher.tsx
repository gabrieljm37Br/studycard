import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
    SUPPORTED_LANGUAGES,
    getCurrentLanguage,
    changeLanguage,
    SupportedLanguage
} from '../services/i18n';

interface LanguageSwitcherProps {
    className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => getCurrentLanguage());
    const containerRef = useRef<HTMLDivElement>(null);

    const activeOption = SUPPORTED_LANGUAGES.find(opt => opt.code === currentLang) || SUPPORTED_LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleSelectLanguage = async (code: SupportedLanguage) => {
        await changeLanguage(code);
        setCurrentLang(code);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={t('selectLanguage', 'Selecionar idioma')}
            >
                <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-sm leading-none" aria-hidden="true">{activeOption.flag}</span>
                <span className="uppercase tracking-wider font-semibold">{activeOption.code.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label={t('selectLanguage', 'Selecionar idioma')}
                    className="absolute right-0 mt-1 w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
                >
                    {SUPPORTED_LANGUAGES.map(option => {
                        const isSelected = option.code === currentLang;
                        return (
                            <button
                                key={option.code}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleSelectLanguage(option.code)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors text-left ${
                                    isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-base leading-none" aria-hidden="true">{option.flag}</span>
                                    <span>{t(`language_${option.code}`, option.label)}</span>
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
