import React from 'react';
import { HelpSectionProps } from './types';

export const HelpTipsSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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
    );
};
