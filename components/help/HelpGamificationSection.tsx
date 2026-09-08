import React from 'react';
import { HelpSectionProps } from './types';

export const HelpGamificationSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
