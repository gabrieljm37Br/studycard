import React from 'react';
import { HelpSectionProps } from './types';

export const HelpOrganizationSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
