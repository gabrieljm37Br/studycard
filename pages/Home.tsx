import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const actions = [
    { label: 'Dashboard', description: 'Gerencie e navegue pelos seus decks', path: '/dashboard' },
    { label: 'Gerador', description: 'Crie flashcards com IA', path: '/generator' },
    { label: 'Simulados', description: 'Modo de simulação e provas', path: '/simulations' },
    { label: 'Estatísticas', description: 'Acompanhe seu progresso', path: '/statistics' },
    { label: 'Calendário de Estudos', description: 'Planeje sua rotina', path: '/calendar' },
    { label: 'Linha do Tempo', description: 'Veja seu histórico de estudos', path: '/topicogram' },
];

const Home: React.FC = () => {
    const { signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
                        <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md">
                <div className="max-w-6xl mx-auto w-full px-4 py-6 md:px-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                            <p className="text-xs uppercase tracking-widest text-white/70">P?gina Inicial</p>
                            <h1 className="text-3xl md:text-4xl font-bold leading-tight">StudyCard</h1>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                            <button
                                onClick={() => navigate('/help')}
                                className="p-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                title="Central de Ajuda"
                                aria-label="Abrir central de ajuda"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                                aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                            >
                                {theme === 'dark' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white cursor-pointer text-sm font-semibold transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-10 md:px-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bem-vindo de volta!</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Escolha uma área para continuar seus estudos.</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Ir para Dashboard
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {actions.map((action) => (
                            <button
                                key={action.path}
                                onClick={() => navigate(action.path)}
                                className="w-full text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{action.label}</h3>
                                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">Entrar →</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{action.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
