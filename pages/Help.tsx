import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Section {
    id: string;
    title: string;
    icon: string;
}

const sections: Section[] = [
    { id: 'intro', title: 'Introdução', icon: '👋' },
    { id: 'criacao', title: 'Criação de Flashcards', icon: '✨' },
    { id: 'organizacao', title: 'Organização de Decks', icon: '📁' },
    { id: 'estudo', title: 'Modo de Estudo', icon: '📚' },
    { id: 'simulado', title: 'Modo Simulado', icon: '🎯' },
    { id: 'srs', title: 'Repetição Espaçada (SRS)', icon: '⏳' },
    { id: 'calendario', title: 'Calendário de Estudo', icon: '📅' },
    { id: 'estatisticas', title: 'Estatísticas e Desempenho', icon: '📊' },
    { id: 'gamificacao', title: 'Gamificação', icon: '🏆' },
    { id: 'permissoes', title: 'Permissões do Usuário', icon: '🔒' },
    { id: 'dicas', title: 'Dicas e Melhores Práticas', icon: '💡' },
];

const Help: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [activeSection, setActiveSection] = useState('intro');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = sections.map(section => ({
                id: section.id,
                element: document.getElementById(section.id)
            }));

            const scrollPosition = window.scrollY + 150;

            for (let i = sectionElements.length - 1; i >= 0; i--) {
                const section = sectionElements[i];
                if (section.element && section.element.offsetTop <= scrollPosition) {
                    setActiveSection(section.id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 100;
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 md:p-6 shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Voltar ao Dashboard"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold">📖 Central de Ajuda</h1>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex relative">
                {/* Sidebar */}
                <aside className={`
                    fixed md:sticky top-[72px] md:top-[88px] left-0 h-[calc(100vh-72px)] md:h-[calc(100vh-88px)]
                    w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                    transition-transform duration-300 z-30
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <nav className="p-4 overflow-y-auto h-full">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Navegação
                        </h2>
                        <ul className="space-y-2">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => scrollToSection(section.id)}
                                        className={`
                                            w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3
                                            ${activeSection === section.id
                                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        <span className="text-xl">{section.icon}</span>
                                        <span className="text-sm">{section.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Overlay for mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {/* Introdução */}
                    <section id="intro" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>👋</span> Introdução
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                Bem-vindo ao <strong>Flashcards AI</strong>, sua plataforma inteligente de estudos!
                                Este aplicativo foi desenvolvido para otimizar seu aprendizado através de flashcards
                                gerados por inteligência artificial e organizados de forma eficiente.
                            </p>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                Principais Funcionalidades
                            </h3>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">✓</span>
                                    <span>Geração automática de flashcards usando IA</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">✓</span>
                                    <span>Criação manual de flashcards personalizados</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">✓</span>
                                    <span>Organização hierárquica com decks e subdecks</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">✓</span>
                                    <span>Sistema de estudo com avaliação automática</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">✓</span>
                                    <span>Gamificação com XP, níveis e conquistas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">✓</span>
                                    <span>Timer Pomodoro integrado para sessões de estudo</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Criação de Flashcards */}
                    <section id="criacao" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>✨</span> Criação de Flashcards
                        </h2>

                        <div className="space-y-6">
                            {/* Geração por IA */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>🤖</span> Geração por IA
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O aplicativo oferece várias formas de gerar flashcards automaticamente usando inteligência artificial:
                                </p>

                                <div className="space-y-4">
                                    <div className="pl-4 border-l-4 border-indigo-500">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">📝 Por Tópico</h4>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Digite um tópico de interesse e a IA irá pesquisar na web e gerar flashcards
                                            relevantes sobre o assunto.
                                        </p>
                                    </div>

                                    <div className="pl-4 border-l-4 border-purple-500">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">📄 Por Texto</h4>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Cole ou digite um texto e a IA extrairá os conceitos principais para criar
                                            flashcards educativos.
                                        </p>
                                    </div>

                                    <div className="pl-4 border-l-4 border-pink-500">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">📎 Por Arquivo PDF</h4>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Faça upload de um arquivo PDF e a IA analisará o conteúdo para gerar
                                            flashcards automaticamente.
                                        </p>
                                    </div>

                                    <div className="pl-4 border-l-4 border-blue-500">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">📋 Por Arquivo TXT</h4>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Envie um arquivo de texto (.txt) e a IA processará o conteúdo para criar
                                            flashcards baseados nas informações do arquivo.
                                        </p>
                                    </div>

                                    <div className="pl-4 border-l-4 border-green-500">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">📊 Por Arquivo CSV</h4>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Importe dados estruturados de arquivos CSV e a IA transformará as informações
                                            em flashcards organizados.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Criação Manual */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>✍️</span> Criação Manual
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Você também pode criar flashcards manualmente, escolhendo o tipo e preenchendo
                                    os campos específicos de cada formato.
                                </p>
                            </div>

                            {/* Tipos de Flashcards */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <span>🎴</span> Tipos de Flashcards Disponíveis
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                                            ❓ Pergunta e Resposta (Q&A)
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Formato clássico com uma pergunta na frente e a resposta no verso.
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                            ✓✗ Verdadeiro ou Falso
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Apresenta uma afirmação para você avaliar se é verdadeira ou falsa,
                                            com explicação.
                                        </p>
                                    </div>

                                    <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                                        <h4 className="font-semibold text-pink-700 dark:text-pink-300 mb-2">
                                            🔘 Múltipla Escolha
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Questão com várias alternativas, onde apenas uma é correta.
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                            📝 Preencher Lacunas
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Frase com espaços em branco para você completar com a palavra correta.
                                        </p>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 md:col-span-2">
                                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                                            💻 Exemplo Prático
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Apresenta um problema prático com uma pergunta específica e sua solução detalhada.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Organização de Decks */}
                    <section id="organizacao" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>📁</span> Organização de Decks
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Estrutura Hierárquica
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Os flashcards são organizados em <strong>decks</strong>, que podem conter
                                    <strong> subdecks</strong> para uma organização ainda mais detalhada.
                                </p>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Exemplo de hierarquia:</p>
                                    <div className="font-mono text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                        <div>📁 Programação</div>
                                        <div className="pl-4">📁 JavaScript</div>
                                        <div className="pl-8">📁 React</div>
                                        <div className="pl-12">🎴 Flashcards sobre Hooks</div>
                                        <div className="pl-8">📁 Node.js</div>
                                        <div className="pl-4">📁 Python</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Operações com Decks
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">➕</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Criar Deck</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Digite o nome do deck e clique em "Criar". O deck será criado no nível atual da navegação.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">✏️</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Renomear Deck</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Passe o mouse sobre um deck e clique no ícone de lápis para renomeá-lo.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">➡️</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Mover Deck</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Clique no ícone de seta para mover o deck para outro local na hierarquia.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🗑️</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Excluir Deck</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Clique no ícone de lixeira para excluir o deck e todos os seus flashcards.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">⚙️</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Gerenciar Flashcards</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Clique em "Gerenciar" para ver, editar, mover ou excluir flashcards individuais do deck.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Modo de Estudo */}
                    <section id="estudo" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>📚</span> Modo de Estudo
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Como Iniciar uma Sessão
                                </h3>
                                <ol className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">1.</span>
                                        <span>No Dashboard, clique no botão "📚 Estudar" em qualquer deck</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">2.</span>
                                        <span>Os flashcards do deck (incluindo subdecks) serão carregados</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">3.</span>
                                        <span>Responda cada flashcard e avalie seu desempenho</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">4.</span>
                                        <span>Ao final, você receberá XP e poderá desbloquear conquistas!</span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Sistema de Avaliação
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O aplicativo utiliza dois tipos de avaliação dependendo do tipo de flashcard:
                                </p>

                                {/* Avaliação Automática */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                        <span className="text-xl">🤖</span> Avaliação Automática
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
                                        Para os seguintes tipos de flashcards, o sistema avalia automaticamente se sua resposta está correta:
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                            <div className="font-semibold text-purple-700 dark:text-purple-300 text-sm flex items-center gap-2">
                                                <span>✓✗</span> Verdadeiro ou Falso
                                            </div>
                                        </div>

                                        <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-200 dark:border-pink-800">
                                            <div className="font-semibold text-pink-700 dark:text-pink-300 text-sm flex items-center gap-2">
                                                <span>🔘</span> Múltipla Escolha
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm flex items-center gap-2">
                                                <span>📝</span> Preencher Lacunas
                                            </div>
                                        </div>

                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                            <div className="font-semibold text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                                                <span>💻</span> Exemplo Prático
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Como funciona:</strong> Você seleciona ou digita sua resposta, e o sistema
                                            compara automaticamente com a resposta correta, marcando como ✅ Correto ou ❌ Incorreto.
                                        </p>
                                    </div>
                                </div>

                                {/* Autoavaliação */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                        <span className="text-xl">👤</span> Autoavaliação
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
                                        Para flashcards do tipo <strong>Pergunta e Resposta (Q&A)</strong>, você é responsável
                                        por avaliar seu próprio desempenho:
                                    </p>

                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-3">
                                        <div className="font-semibold text-indigo-700 dark:text-indigo-300 text-sm flex items-center gap-2 mb-2">
                                            <span>❓</span> Pergunta e Resposta (Q&A)
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Após ver a resposta, você decide se acertou, errou ou chegou perto.
                                        </p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mb-3">
                                        <div className="font-semibold text-green-700 dark:text-green-300 text-sm flex items-center gap-2 mb-2">
                                            <span>📖</span> Dicionário
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Para termos e definições. Compare sua resposta com o conceito e marque Incorreto/Quase/Correto.
                                        </p>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-3">
                                        <div className="font-semibold text-yellow-700 dark:text-yellow-300 text-sm flex items-center gap-2 mb-2">
                                            <span>💡</span> Exemplo Prático
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Casos práticos também são autoavaliados: leia problema/pergunta/solução e marque seu desempenho.
                                        </p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mb-3">
                                        <div className="font-semibold text-green-700 dark:text-green-300 text-sm flex items-center gap-2 mb-2">
                                            <span>💻</span> Exemplo Prático
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Avaliação manual: compare sua solução com a resposta e marque Incorreto/Quase/Correto.
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-3">
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                            <h5 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                                ❌ Incorreto
                                            </h5>
                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                Clique se você errou a resposta ou não sabia.
                                            </p>
                                        </div>

                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                            <h5 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1 text-sm">
                                                ⚠️ Quase
                                            </h5>
                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                Clique se você acertou parcialmente ou chegou perto da resposta.
                                            </p>
                                        </div>

                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                            <h5 className="font-semibold text-green-700 dark:text-green-300 mb-1 text-sm">
                                                ✅ Correto
                                            </h5>
                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                Clique se você acertou completamente a resposta.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Timer Pomodoro
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O modo de estudo inclui um timer Pomodoro configurável para ajudar você a
                                    manter o foco durante as sessões de estudo.
                                </p>

                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Dica:</strong> Clique no ícone de engrenagem no timer para ajustar
                                        a duração do trabalho e das pausas de acordo com sua preferência.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Estatísticas de Desempenho
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Durante a sessão, você pode ver em tempo real:
                                </p>

                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-600 dark:text-green-400">✓</span>
                                        <span>Número de acertos</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-red-600 dark:text-red-400">✗</span>
                                        <span>Número de erros</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400">📊</span>
                                        <span>Progresso total da sessão</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>📝</span> Anotações
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Você pode fazer anotações pessoais em cada flashcard durante o estudo.
                                    Essas anotações são privadas e vinculadas ao flashcard específico.
                                </p>

                                <div className="space-y-3">
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                                            Como usar:
                                        </h4>
                                        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <li className="flex items-start gap-2">
                                                <span className="font-semibold text-amber-600 dark:text-amber-400">1.</span>
                                                <span>Clique no botão "📝 Anotações" abaixo do flashcard</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="font-semibold text-amber-600 dark:text-amber-400">2.</span>
                                                <span>Digite suas anotações no campo de texto (máximo 1000 caracteres)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="font-semibold text-amber-600 dark:text-amber-400">3.</span>
                                                <span>Clique em "Salvar Anotação" para guardar suas observações</span>
                                            </li>
                                        </ol>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>💡 Dica:</strong> Use anotações para registrar dúvidas, insights,
                                            exemplos adicionais ou qualquer informação que ajude na sua revisão futura.
                                            Flashcards com anotações são marcados com um indicador visual (●) no botão.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Modo Simulado */}
                    <section id="simulado" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>🎯</span> Modo Simulado
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Como criar um simulado
                                </h3>
                                <ol className="space-y-2 text-gray-700 dark:text-gray-300 list-decimal list-inside">
                                    <li>Na página Modo Simulado, clique em “+ Novo Simulado”.</li>
                                    <li>Informe o nome, quantidade de questões e as modalidades que deseja praticar.</li>
                                    <li>Selecione um ou mais decks (os subdecks também entram no sorteio).</li>
                                    <li>Confirme para gerar: as questões são embaralhadas e adicionadas ao novo simulado.</li>
                                </ol>
                                <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                                    <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Validações automáticas</h4>
                                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                        <li>✔️ Verifica se cada modalidade escolhida tem ao menos um flashcard disponível.</li>
                                        <li>✔️ Confere se há cards suficientes para a quantidade solicitada.</li>
                                        <li>✔️ Em caso de falta de cards ou modalidade, exibimos o motivo e nada é salvo.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Gerenciando e executando simulados
                                </h3>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>Abra um simulado criado para ver os detalhes ou iniciar imediatamente.</li>
                                    <li>O progresso e a ordem das questões são definidos no momento da criação.</li>
                                    <li>Use o botão de exclusão para remover simulados que não precisa mais.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Repetição Espaçada (SRS) */}
                    <section id="srs" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>⏳</span> Repetição Espaçada (SRS)
                        </h2>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                        Como funciona
                                    </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O app usa o algoritmo SM-2 (SuperMemo-2) para agendar revisões. Cada resposta recalcula
                                    intervalo, repetição, fator de facilidade e a próxima data de revisão (<em>next_review</em>).
                                    Você só vê cards vencidos ou novos.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-lg">
                                        <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Notas (Quality)</h4>
                                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                            <li>Q&A (autoavaliação): ❌ 0 | ⚠️ 3 | ✅ 5</li>
                                            <li>Automático (VF/Múltipla/Preencher): Erro 0 | Acerto 5</li>
                                            <li>Quality &lt; 3: intervalo volta a 1 dia e o card reaparece na sessão.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Campos no card</h4>
                                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                            <li><code>next_review</code>: próxima revisão.</li>
                                            <li><code>interval</code>: dias até a próxima.</li>
                                            <li><code>repetition</code>: número de acertos consecutivos.</li>
                                            <li><code>ease_factor</code>: fator de facilidade (mínimo 1.3).</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Calendário de Estudo */}
                    <section id="calendario" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>📅</span> Calendário de Estudo
                        </h2>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                Visualize todas as revisões programadas (SM-2) e adicione itens customizados por data.
                            </p>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                <li>• As revisões vêm de flashcards com <code>next_review</code>.</li>
                                <li>• Clique em uma data para ver a lista de revisões e itens customizados.</li>
                                <li>• Use o formulário lateral para adicionar tarefas de estudo personalizadas.</li>
                                <li>• Acesse pelo botão “📅 Calendário” no Dashboard.</li>
                            </ul>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-lg text-sm text-indigo-800 dark:text-indigo-200">
                                Dica: se nada aparece em uma data, significa que não há revisões vencidas ou agendadas para aquele dia.
                            </div>
                        </div>
                    </section>

                    {/* Estatísticas e Desempenho */}
                    <section id="estatisticas" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>📊</span> Estatísticas e Desempenho
                        </h2>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                Acompanhe retenção, carga de revisão e hábitos de estudo. Use a página de Estatísticas para ver:
                            </p>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                <li>• KPIs rápidos: streak, total estudado e taxa de retenção.</li>
                                <li>• Gráficos: previsão de revisão (7 dias) e maturidade dos cards (Novos, Aprendendo, Jovens, Maduros).</li>
                                <li>• Heatmap de atividade (últimos 365 dias) no estilo contribuições do GitHub.</li>
                                <li>• Decks que precisam de atenção (menor taxa de acerto) e dica de IA baseada na retenção.</li>
                            </ul>
                            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                Acesse pelo botão <strong>📊 Estatísticas</strong> no Dashboard. Os gráficos usam dados consolidados do Supabase (RPCs), evitando baixar muitos registros.
                            </div>
                        </div>
                    </section>

                    {/* Gamificação */}
                    <section id="gamificacao" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>🏆</span> Gamificação
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Sistema de XP e Níveis
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Cada vez que você estuda, ganha pontos de experiência (XP) baseados no seu desempenho:
                                </p>

                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                        <li className="flex items-center gap-2">
                                            <span className="text-green-600 dark:text-green-400 font-semibold">+10 XP</span>
                                            <span>por resposta correta</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">+2 XP</span>
                                            <span>por resposta "Quase" em flashcards de Pergunta e Resposta (Q&A)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-600 dark:text-blue-400 font-semibold">+50 XP</span>
                                            <span>bônus ao completar uma sessão de estudo</span>
                                        </li>
                                    </ul>
                                </div>

                                <p className="text-gray-700 dark:text-gray-300 mt-4">
                                    Conforme você acumula XP, sobe de nível! Cada nível requer mais XP que o anterior.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Conquistas e Badges
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Desbloqueie conquistas especiais ao atingir marcos importantes:
                                </p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <div className="text-3xl mb-2">🎯</div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Primeira Sessão</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Complete sua primeira sessão de estudos
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <div className="text-3xl mb-2">🔥</div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Sequência de 7 Dias</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Estude por 7 dias consecutivos
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <div className="text-3xl mb-2">💯</div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Perfeccionista</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Acerte 100% em uma sessão de estudo
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="text-3xl mb-2">📚</div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Estudioso</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Complete 50 sessões de estudo
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Sequência de Dias (Streak)
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Mantenha sua motivação estudando todos os dias! O contador de streak mostra
                                    quantos dias consecutivos você está estudando.
                                </p>

                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Atenção:</strong> Se você pular um dia, sua sequência será reiniciada.
                                        Estude pelo menos uma vez por dia para manter seu streak!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Permissões do Usuário */}
                    <section id="permissoes" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>🔒</span> Permissões do Usuário
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Autenticação e Segurança
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O Flashcards AI utiliza autenticação segura via Supabase para proteger seus dados:
                                </p>

                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-1">🔐</span>
                                        <span>Senhas criptografadas e armazenadas com segurança</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-1">🔐</span>
                                        <span>Sessões autenticadas com tokens seguros</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-1">🔐</span>
                                        <span>Proteção contra acesso não autorizado</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Privacidade dos Dados
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Todos os seus dados são privados e isolados:
                                </p>

                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Seus decks e flashcards são visíveis apenas para você</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Seu progresso e estatísticas são privados</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Suas conquistas e XP são pessoais</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Nenhum outro usuário pode acessar seus dados</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Gerenciamento de Perfil
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Seu perfil contém informações básicas como nome, email, nível e XP.
                                    Todas as operações (criar, editar, excluir) são restritas aos seus próprios dados.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Dicas e Melhores Práticas */}
                    <section id="dicas" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>💡</span> Dicas e Melhores Práticas
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Como Criar Flashcards Eficazes
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">📌</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Seja Conciso</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Flashcards funcionam melhor com informações curtas e diretas.
                                                Evite textos muito longos.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">🎯</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Foque em um Conceito</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Cada flashcard deve abordar apenas um conceito ou ideia principal.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">🔄</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Use Suas Próprias Palavras</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Ao criar flashcards manualmente, reformule o conteúdo com suas próprias
                                                palavras para melhor compreensão.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Estratégias de Estudo
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">⏰</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Estude Regularmente</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Sessões curtas e frequentes são mais eficazes que sessões longas e esporádicas.
                                                Use o timer Pomodoro!
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">🔁</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Revise Periodicamente</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Volte aos decks antigos regularmente para reforçar o aprendizado e
                                                evitar o esquecimento.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">📊</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Acompanhe seu Progresso</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Use as estatísticas para identificar áreas que precisam de mais atenção.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Edição de Flashcards com Formatação HTML
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Ao editar flashcards, você pode usar formatação HTML básica para destacar
                                    informações importantes:
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                                            <span className="font-bold">B</span> Negrito
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Use para destacar palavras-chave ou conceitos importantes:
                                        </p>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                                            &lt;b&gt;texto em negrito&lt;/b&gt;
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            Resultado: <strong>texto em negrito</strong>
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                                            <span className="italic">I</span> Itálico
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Use para enfatizar termos técnicos ou estrangeiros:
                                        </p>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                                            &lt;i&gt;texto em itálico&lt;/i&gt;
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            Resultado: <em>texto em itálico</em>
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                                            <span className="underline">U</span> Sublinhado
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Use para destacar informações que precisam de atenção especial:
                                        </p>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                                            &lt;u&gt;texto sublinhado&lt;/u&gt;
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            Resultado: <u>texto sublinhado</u>
                                        </p>
                                    </div>

                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                            💡 Exemplo Combinado
                                        </h4>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm mb-2">
                                            A &lt;b&gt;fotossíntese&lt;/b&gt; é o processo pelo qual &lt;i&gt;plantas&lt;/i&gt; convertem &lt;u&gt;luz solar&lt;/u&gt; em energia.
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Resultado: A <strong>fotossíntese</strong> é o processo pelo qual <em>plantas</em> convertem <u>luz solar</u> em energia.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Uso do Modo Escuro
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O modo escuro pode reduzir o cansaço visual durante sessões longas de estudo,
                                    especialmente em ambientes com pouca luz.
                                </p>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Dica:</strong> Clique no ícone de sol/lua no canto superior direito
                                        do Dashboard para alternar entre os temas claro e escuro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Ainda tem dúvidas? Entre em contato com o suporte ou volte ao{' '}
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
