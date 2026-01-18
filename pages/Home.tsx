import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageHeader } from '../contexts/PageHeaderContext';

const actions = [
    { label: 'Dashboard', description: 'Gerencie e navegue pelos seus decks', path: '/dashboard' },
    { label: 'Gerador', description: 'Crie flashcards com IA', path: '/generator' },
    { label: 'Simulados', description: 'Modo de simulação e provas', path: '/simulations' },
    { label: 'Estatísticas', description: 'Acompanhe seu progresso', path: '/statistics' },
    { label: 'Calendário de Estudos', description: 'Planeje sua rotina', path: '/calendar' },
    { label: 'Linha do Tempo', description: 'Veja seu histórico de estudos', path: '/topicogram' },
];

const Home: React.FC = () => {
    const { user } = useAuth();
    const { setHeader } = usePageHeader();
    const navigate = useNavigate();

    useEffect(() => {
        setHeader('Início', 'Escolha rapidamente para onde ir');
    }, [setHeader]);

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Bem-vindo de volta{user ? `, ${user.email?.split('@')[0] || ''}` : ''}!
                        </h2>
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
        </div>
    );
};

export default Home;
