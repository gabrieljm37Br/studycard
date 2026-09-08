import React from 'react';
import { HelpSectionProps } from './types';

export const HelpCalendarSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
