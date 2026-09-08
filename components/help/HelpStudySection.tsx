import React from 'react';
import { HelpSectionProps } from './types';

export const HelpStudySection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
