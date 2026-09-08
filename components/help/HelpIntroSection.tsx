import React from 'react';
import { HelpSectionProps } from './types';

export const HelpIntroSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
                    <section id="intro" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>👋</span> Introdução
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                Bem-vindo ao <strong>StudyCard</strong>, sua plataforma inteligente de estudos!
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
                            <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                    Como usar esta Central
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                    <li>Use o menu lateral para abrir a secao desejada (Importar CSV, Modo de Estudo, etc.).</li>
                                    <li>Leia os passos e requisitos de formato antes de importar ou criar cards para evitar erros.</li>
                                    <li>Quando um botao for citado, ele esta na tela correspondente (Gerador, Detalhe do Deck ou Dashboard).</li>
                                </ol>
                            </div>
                        </div>
                    </section>
    );
};
