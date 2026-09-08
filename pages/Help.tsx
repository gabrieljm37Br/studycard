import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, ArrowRight, Menu, X, Home } from 'lucide-react';
import {
    HELP_SECTIONS,
    HelpSection,
    HELP_SECTION_COMPONENTS,
    HelpIntroSection
} from '../components/help';

const Help: React.FC = () => {
    const navigate = useNavigate();

    // Initialize active section from URL hash if valid, otherwise fallback to 'intro'
    const getInitialSectionId = (): string => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            if (HELP_SECTIONS.some(s => s.id === hash)) {
                return hash;
            }
        }
        return 'intro';
    };

    const [activeSectionId, setActiveSectionId] = useState<string>(getInitialSectionId);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Sync hash changes from external clicks or browser back/forward
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && HELP_SECTIONS.some(s => s.id === hash)) {
                setActiveSectionId(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Change section and update hash without full-page reloads
    const handleSelectSection = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setIsSidebarOpen(false);
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#${sectionId}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const copyToClipboard = (text: string, message = 'Copiado!') => {
        navigator.clipboard.writeText(text);
        alert(message);
    };

    // Filter sections based on search input
    const filteredSections = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return HELP_SECTIONS;
        return HELP_SECTIONS.filter(s =>
            s.title.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    // Determine current section metadata and pagination
    const currentSectionIndex = HELP_SECTIONS.findIndex(s => s.id === activeSectionId);
    const currentSection = HELP_SECTIONS[currentSectionIndex] || HELP_SECTIONS[0];
    const prevSection: HelpSection | null = currentSectionIndex > 0 ? HELP_SECTIONS[currentSectionIndex - 1] : null;
    const nextSection: HelpSection | null = currentSectionIndex < HELP_SECTIONS.length - 1 ? HELP_SECTIONS[currentSectionIndex + 1] : null;

    // Resolve component for active section on-demand
    const ActiveSectionComponent = HELP_SECTION_COMPONENTS[activeSectionId] || HelpIntroSection;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            {/* Top Bar */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label={isSidebarOpen ? 'Fechar menu de tópicos' : 'Abrir menu de tópicos'}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                    >
                        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <span>📖</span> Central de Ajuda & Documentação
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                            Manuais passo a passo, sintaxe, boas práticas e atalhos do StudyCard
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 transition"
                >
                    <Home size={16} />
                    <span className="hidden sm:inline">Dashboard</span>
                </button>
            </header>

            <div className="max-w-7xl mx-auto flex relative">
                {/* Sidebar Navigation */}
                <aside
                    aria-label="Menu de seções da documentação"
                    className={`
                        fixed md:sticky top-[57px] left-0 h-[calc(100vh-57px)]
                        w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                        transition-transform duration-300 z-30 flex flex-col
                        ${isSidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'}
                    `}
                >
                    {/* Search / Filter Box */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar tópico ou guia..."
                                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-lg outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Section Links */}
                    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                        {filteredSections.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                Nenhum tópico encontrado para "{searchQuery}".
                            </div>
                        ) : (
                            filteredSections.map(section => {
                                const isActive = activeSectionId === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => handleSelectSection(section.id)}
                                        className={`
                                            w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3
                                            ${isActive
                                                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold border-l-4 border-indigo-600 dark:border-indigo-400'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                                            }
                                        `}
                                    >
                                        <span className="text-lg shrink-0">{section.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium truncate">{section.title}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </nav>

                    {/* Sidebar Footer Info */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                        {HELP_SECTIONS.length} tópicos disponíveis
                    </div>
                </aside>

                {/* Mobile Backdrop Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Main Content: Rendered On-Demand */}
                <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 max-w-4xl">
                    {/* Active Topic Header Badge */}
                    <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{currentSection.icon}</span>
                            <div>
                                <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                                    Tópico {currentSectionIndex + 1} de {HELP_SECTIONS.length}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {currentSection.title}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Active Section Content */}
                    <div className="min-h-[400px]">
                        <ActiveSectionComponent copyToClipboard={copyToClipboard} />
                    </div>

                    {/* Linear Pagination Buttons (Previous / Next Topic) */}
                    <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {prevSection ? (
                            <button
                                onClick={() => handleSelectSection(prevSection.id)}
                                className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition text-left"
                            >
                                <ArrowLeft size={16} />
                                <div>
                                    <div className="text-[10px] uppercase text-gray-400">Anterior</div>
                                    <div className="font-semibold truncate max-w-[200px]">{prevSection.icon} {prevSection.title}</div>
                                </div>
                            </button>
                        ) : (
                            <div className="hidden sm:block" />
                        )}

                        {nextSection && (
                            <button
                                onClick={() => handleSelectSection(nextSection.id)}
                                className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition text-right shadow-sm ml-auto"
                            >
                                <div>
                                    <div className="text-[10px] uppercase text-indigo-200">Próximo</div>
                                    <div className="font-semibold truncate max-w-[200px]">{nextSection.icon} {nextSection.title}</div>
                                </div>
                                <ArrowRight size={16} />
                            </button>
                        )}
                    </div>

                    {/* Support and Return to Dashboard */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                            Ainda tem dúvidas ou sugestões? Entre em contato com o suporte ou retorne ao{' '}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                            >
                                Dashboard
                            </button>
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Help;
