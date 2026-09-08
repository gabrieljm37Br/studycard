import React from 'react';
import { HelpSectionProps } from './types';

export const HelpSimulatedSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
