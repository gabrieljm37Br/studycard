import React from 'react';
import { HelpSectionProps } from './types';

export const HelpSrsSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
