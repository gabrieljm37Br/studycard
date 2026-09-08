import React from 'react';
import { HelpSectionProps } from './types';

export const HelpStatisticsSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
