import React from 'react';
import { HelpSectionProps } from './types';

export const HelpCreationSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
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

                                <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-200">
                                    <p className="font-semibold mb-2">Passo a passo rÇ¡pido no Gerador:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Abra o Gerador e selecione o deck ou crie um novo.</li>
                                        <li>Escolha a fonte (TÇüpico, Texto, PDF, Arquivo TXT/CSV ou Manual).</li>
                                        <li>Envie o conteÇ§do (colar texto ou fazer upload) e aguarde a geraÇõÇœo.</li>
                                        <li>Revise o preview, adicione tags se quiser e salve.</li>
                                    </ol>
                                </div>

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
                                            Importe flashcards em massa de arquivos CSV, especialmente útil para flashcards
                                            exportados do NotebookLM. O sistema detecta automaticamente o tipo de cada flashcard.
                                            <span className="block mt-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                                → Veja a seção "Importar CSV" para detalhes completos
                                            </span>
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
    );
};
