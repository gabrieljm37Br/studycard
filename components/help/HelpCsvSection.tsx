import React from 'react';
import { HelpSectionProps } from './types';

export const HelpCsvSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
                    <section id="importar-csv" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>📥</span> Importar CSV
                        </h2>

                        <div className="space-y-6">
                            {/* Introdução */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    O que é a Importação CSV?
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    A funcionalidade de importação CSV permite que você importe flashcards em massa a partir de
                                    arquivos CSV (Comma-Separated Values). Esta é uma forma rápida e eficiente de adicionar
                                    múltiplos flashcards ao seu deck de uma só vez.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>💡 Compatibilidade:</strong> Esta funcionalidade foi desenvolvida especialmente para
                                        funcionar com flashcards exportados do <strong>NotebookLM</strong>, mas também aceita
                                        qualquer arquivo CSV formatado corretamente.
                                    </p>
                                </div>
                            </div>

                            {/* Formato do Arquivo */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Formato do Arquivo CSV
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O arquivo CSV deve seguir o seguinte formato:
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Estrutura Básica:</h4>
                                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <li className="flex items-start gap-2">
                                                <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                                <span><strong>2 colunas:</strong> Frente (pergunta) e Verso (resposta)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                                <span><strong>Sem cabeçalho:</strong> Não inclua linha de cabeçalho</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                                <span><strong>Separador:</strong> Vírgula (,) entre as colunas</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                                <span><strong>Uma linha por flashcard:</strong> Cada linha representa um flashcard</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Exemplo de Arquivo CSV:</h4>
                                        <pre className="bg-gray-800 dark:bg-gray-950 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                            {`O que é React?,Uma biblioteca JavaScript para construir interfaces de usuário
O que significa _____ em programação?,API - Application Programming Interface
Qual a capital do Brasil?,Brasília`}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Detecção Automática de Tipo */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>🤖</span> Detecção Automática de Tipo
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O sistema detecta automaticamente o tipo de cada flashcard baseado no conteúdo da frente (pergunta):
                                </p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                                            <span>📝</span> Preencher Lacunas
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Detectado quando a pergunta contém underscores (<code className="bg-purple-100 dark:bg-purple-800 px-1 rounded">_____</code>)
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Exemplo: "A capital do Brasil é _____"
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                            <span>❓</span> Pergunta e Resposta
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Detectado quando a pergunta NÃO contém underscores
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Exemplo: "O que é React?"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Como Importar */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Como Importar Flashcards
                                </h3>

                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3">Passo a Passo:</h4>
                                        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[24px]">1.</span>
                                                <div>
                                                    <strong>Acesse o Gerador ou Detalhes do Deck:</strong>
                                                    <p className="text-sm mt-1">Clique no botão <code className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded">📥 Importar CSV</code> disponível na página do Gerador ou na página de Detalhes de um deck específico.</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[24px]">2.</span>
                                                <div>
                                                    <strong>Selecione o Arquivo CSV:</strong>
                                                    <p className="text-sm mt-1">No modal que abrir, clique para selecionar seu arquivo .csv do computador.</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[24px]">3.</span>
                                                <div>
                                                    <strong>Visualize o Preview:</strong>
                                                    <p className="text-sm mt-1">O sistema processará o arquivo e mostrará uma prévia de todos os flashcards detectados, incluindo o tipo de cada um (Pergunta e Resposta ou Preencher Lacunas).</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[24px]">4.</span>
                                                <div>
                                                    <strong>Escolha o Deck de Destino:</strong>
                                                    <p className="text-sm mt-1">Selecione um deck existente ou crie um novo deck para receber os flashcards importados.</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[24px]">5.</span>
                                                <div>
                                                    <strong>Confirme a Importação:</strong>
                                                    <p className="text-sm mt-1">Clique em "Importar X Flashcards" para finalizar. Todos os flashcards serão adicionados ao deck selecionado.</p>
                                                </div>
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            {/* Dicas e Melhores Práticas */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>💡</span> Dicas e Melhores Práticas
                                </h3>

                                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Use aspas para textos com vírgulas:</strong> Se sua pergunta ou resposta contiver vírgulas, coloque o texto entre aspas duplas.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Verifique o preview:</strong> Sempre revise a prévia dos flashcards antes de importar para garantir que foram detectados corretamente.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Organize por temas:</strong> Crie decks separados para diferentes assuntos ou tópicos para facilitar o estudo.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Use underscores consistentemente:</strong> Para flashcards de preencher lacunas, use pelo menos 3 underscores (___) para marcar a lacuna.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Compatibilidade com NotebookLM:</strong> Se você exportar flashcards do NotebookLM, eles já estarão no formato correto e prontos para importação.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Solução de Problemas */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>⚠️</span> Solução de Problemas
                                </h3>

                                <div className="space-y-3">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                            "O arquivo CSV está vazio"
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            Verifique se o arquivo contém dados e não está em branco.
                                        </p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                            "Nenhum flashcard válido encontrado"
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            Certifique-se de que cada linha tem pelo menos 2 colunas (frente e verso) e que nenhuma está vazia.
                                        </p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                            Tipo detectado incorretamente
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            O sistema detecta "Preencher Lacunas" apenas quando há underscores (_) na pergunta. Se quiser forçar o tipo "Pergunta e Resposta", remova os underscores.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
    );
};
