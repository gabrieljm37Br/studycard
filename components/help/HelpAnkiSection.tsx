import React, { useState } from 'react';
import { HelpSectionProps } from './types';

export const HelpAnkiSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    const [showIaPromptFull, setShowIaPromptFull] = useState(false);
    return (
                    <section id="importar-txt-anki" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>📄</span> Importar TXT Anki
                        </h2>

                        <div className="space-y-6">
                            {/* Introdução */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    O que é a Importação TXT Anki?
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Esta funcionalidade permite importar flashcards de arquivos de texto (.txt) exportados do
                                    Anki ou criados manualmente seguindo o formato específico. O sistema utiliza <strong>detecção
                                        automática de tipos</strong> baseada em palavras-chave, sem necessidade de IA.
                                </p>
                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                    <p className="text-sm text-purple-800 dark:text-purple-200">
                                        <strong>💡 Diferencial:</strong> Ao contrário da importação CSV, esta funcionalidade
                                        reconhece automaticamente 6 tipos diferentes de flashcards baseado em palavras-chave
                                        específicas no início de cada bloco.
                                    </p>
                                </div>
                            </div>

                            {/* Formato do Arquivo */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Formato do Arquivo TXT
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O arquivo deve conter blocos de texto separados por linhas em branco, onde cada bloco
                                    representa um flashcard. Cada bloco deve começar com uma palavra-chave específica.
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Estrutura Básica:</h4>
                                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <li className="flex items-start gap-2">
                                                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                                                <span><strong>Palavra-chave inicial:</strong> Define o tipo do flashcard</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                                                <span><strong>Campo "Resposta:"</strong> Obrigatório em todos os tipos</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                                                <span><strong>Campo "Explicação:"</strong> Opcional, adiciona contexto</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                                                <span><strong>Espaçamento:</strong> Pode ser irregular (tabs/espaços múltiplos)</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Exemplo de Arquivo TXT:</h4>
                                            <button
                                                onClick={() => {
                                                    const sample = `Pergunta: O que é React?
Resposta: Uma biblioteca JavaScript para criar interfaces. Explicação: Criada pelo Facebook em 2013.
Tags: web, frontend

Certo ou Errado: TypeScript é fortemente tipado.
Resposta: Verdadeiro
Explicação: Possui tipagem estática opcional.
Tags: web, tipos

Questão: Qual protocolo é usado para comunicação segura na web?
A) HTTP
B) HTTPS
C) FTP
D) SMTP
Resposta: B)
Explicação: HTTPS adiciona TLS/SSL ao HTTP.
Tags: redes, segurança

Dicionário: Idempotência
Significado: Operação que pode ser repetida sem alterar o resultado além da primeira aplicação.
Tags: backend, apis

Hipótese: Empresa quer reduzir tempo de build.
Problema: Qual prática aplicar?
Resposta: Implementar cache de dependências. Explicação: Reduz downloads em builds subsequentes.
Tags: devops, performance`;
                                                    navigator.clipboard.writeText(sample);
                                                    alert('✅ Exemplo copiado para a área de transferência.');
                                                }}
                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-colors"
                                            >
                                                📋 Copiar exemplo
                                            </button>
                                        </div>
                                        <pre className="bg-gray-800 dark:bg-gray-950 text-green-100 p-3 rounded text-xs overflow-x-auto leading-relaxed">
                                            {`Pergunta: O que é React?
Resposta: Uma biblioteca JavaScript para criar interfaces. Explicação: Criada pelo Facebook em 2013.
Tags: web, frontend

Certo ou Errado: TypeScript é fortemente tipado.
Resposta: Verdadeiro
Explicação: Possui tipagem estática opcional.
Tags: web, tipos

Questão: Qual protocolo é usado para comunicação segura na web?
A) HTTP
B) HTTPS
C) FTP
D) SMTP
Resposta: B)
Explicação: HTTPS adiciona TLS/SSL ao HTTP.
Tags: redes, segurança

Dicionário: Idempotência
Significado: Operação que pode ser repetida sem alterar o resultado além da primeira aplicação.
Tags: backend, apis

Hipótese: Empresa quer reduzir tempo de build.
Problema: Qual prática aplicar?
Resposta: Implementar cache de dependências. Explicação: Reduz downloads em builds subsequentes.
Tags: devops, performance`}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Mapeamento de Tipos */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>🔄</span> Mapeamento Automático de Tipos
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O sistema detecta automaticamente o tipo de flashcard baseado na palavra-chave inicial:
                                </p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                            <span>❓</span> Pergunta:
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            → Mapeado para <strong>Pergunta e Resposta</strong>
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Campos: Pergunta, Resposta, Explicação (opcional)
                                        </p>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                                            <span>✅</span> Certo ou Errado:
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            → Mapeado para <strong>Verdadeiro ou Falso</strong>
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Campos: Afirmação, Resposta, Explicação
                                        </p>
                                    </div>

                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                            <span>🔢</span> Questão:
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            → Mapeado para <strong>Múltipla Escolha</strong>
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Preserva formatação de alternativas
                                        </p>
                                    </div>

                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2 flex items-center gap-2">
                                            <span>📖</span> Dicionário:
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            → Mapeado para <strong>Pergunta e Resposta</strong>
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Campo "Significado:" usado como resposta
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                                            <span>💡</span> Situação-Problema:
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            → Mapeado para <strong>Exemplo Prático</strong>
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Combina cenário + questão
                                        </p>
                                    </div>

                                    <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                                        <h4 className="font-semibold text-pink-700 dark:text-pink-300 mb-2 flex items-center gap-2">
                                            <span>🧪</span> Hipótese:
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            → Mapeado para <strong>Exemplo Prático</strong>
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                            Ideal para casos de estudo
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Como Importar */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Como Importar Flashcards do Anki
                                </h3>

                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">Passo a Passo:</h4>
                                        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-purple-600 dark:text-purple-400 min-w-[24px]">1.</span>
                                                <div>
                                                    <strong>Acesse o Gerador ou Detalhes do Deck:</strong>
                                                    <p className="text-sm mt-1">Clique no botão <code className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">📄 TXT Anki</code> disponível na página do Gerador ou na página de Detalhes de um deck específico.</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-purple-600 dark:text-purple-400 min-w-[24px]">2.</span>
                                                <div>
                                                    <strong>Selecione o Arquivo TXT:</strong>
                                                    <p className="text-sm mt-1">No modal que abrir, clique para selecionar seu arquivo .txt do Anki ou criado manualmente.</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-purple-600 dark:text-purple-400 min-w-[24px]">3.</span>
                                                <div>
                                                    <strong>Visualize o Preview:</strong>
                                                    <p className="text-sm mt-1">O sistema processará o arquivo e mostrará uma prévia de todos os flashcards detectados, incluindo o tipo de cada um e estatísticas por categoria.</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-purple-600 dark:text-purple-400 min-w-[24px]">4.</span>
                                                <div>
                                                    <strong>Escolha o Deck de Destino:</strong>
                                                    <p className="text-sm mt-1">Selecione um deck existente ou crie um novo deck para receber os flashcards importados.</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="font-bold text-purple-600 dark:text-purple-400 min-w-[24px]">5.</span>
                                                <div>
                                                    <strong>Confirme a Importação:</strong>
                                                    <p className="text-sm mt-1">Clique em "Importar X Flashcards" para finalizar. Todos os flashcards serão adicionados ao deck selecionado com seus tipos corretos.</p>
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
                                        <span><strong>Espaçamento flexível:</strong> Não se preocupe com tabs ou espaços extras - o sistema normaliza automaticamente.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Separe blocos com linha em branco:</strong> Deixe pelo menos uma linha vazia entre cada flashcard.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Use palavras-chave exatas:</strong> Certifique-se de usar as palavras-chave corretas no início de cada bloco.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Verifique o preview:</strong> Sempre revise a prévia dos flashcards e seus tipos antes de importar.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Múltipla escolha:</strong> Para questões de múltipla escolha, coloque cada alternativa em uma linha separada.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                        <span><strong>Organize por assunto:</strong> Crie decks separados para diferentes temas ou matérias.</span>
                                    </li>
                                </ul>

                                {/* Dica Especial: Prompt de IA */}
                                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="text-2xl">🤖</span>
                                        <div>
                                            <h4 className="font-bold text-indigo-800 dark:text-indigo-200 text-lg mb-1">
                                                Dica Especial: Use IA para Converter seus Flashcards do Anki
                                            </h4>
                                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                                Se você tem flashcards exportados do Anki em formato diferente, use este prompt com ChatGPT, Claude ou outra IA para convertê-los automaticamente:
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                                                📋 Prompt para IA
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setShowIaPromptFull(prev => !prev)}
                                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded transition-colors"
                                                >
                                                    {showIaPromptFull ? 'Recolher' : 'Expandir'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const prompt = `Preciso que você identifique os flashcards no texto fornecido e os transforme em um formato específico de texto estruturado.

FORMATO DE SAÍDA ESPERADO:

Cada flashcard deve seguir este padrão, com blocos separados apenas por espaço, sem caracteres:

Para flashcards de Pergunta e Resposta:

Pergunta: [texto da pergunta]

Resposta: [texto da resposta] [explicação opcional]

Tags: [tags separadas por vírgulas]

Para flashcards de Verdadeiro ou Falso:

Certo ou Errado: [afirmação]

Resposta: [Verdadeiro ou Falso]

Explicação: [explicação]

Tags: [tags separadas por vírgulas]

Para flashcards de Múltipla Escolha:

Questão: [enunciado da questão]

A) [alternativa A]

B) [alternativa B]

C) [alternativa C]

D) [alternativa D]

Resposta: [letra da alternativa correta]

Explicação: [explicação]

Tags: [tags separadas por vírgulas]

Para flashcards de Dicionário/Vocabulário:

Dicionário: [termo]

Significado: [definição]

Tags: [tags separadas por vírgulas]

Para flashcards de Situação-Problema:

Hipótese: [descrição do cenário]

Problema: [pergunta sobre o cenário]

Resposta: [resposta] [explicação]

Tags: [tags separadas por vírgulas]

Para flashcards de Hipótese/Caso de Estudo:

Hipótese: [descrição da hipótese ou caso]

Problema: [pergunta]

Resposta: [resposta] [explicação]

Tags: [tags separadas por vírgulas]

REGRAS IMPORTANTES:

1. Classifique cada flashcard no tipo mais adequado. Adapte se necessário.
2. Mantenha o conteúdo original, apenas reorganize no formato.
3. Separe cada flashcard com espaços, sem caracteres.
4. Use exatamente as palavras-chave especificadas (Pergunta:, Resposta:, etc.).
5. Se não houver explicação no original, você pode omitir o campo "Explicação:".
6. Retire as palavras e caracteres que não integrem os flashcards.
7. Nos de flashcards de Múltipla Escolha, acrescente a letra das alternativas com parêntese após a letra. Ex.: A), B), C), D).
8. Não escreva linha (---) para separar os flashcards.
9. As tags serão determinadas por mim.
10. Não use markdown. Deixe o texto limpo.
11. Adapte os flashcards que não corresponderem diretamente a algum formato indicado.
12. Para que o app identifique a modalidade do Flashcard, você deve organizar o texto e iniciar cada item do Flashcard em uma nova linha.

Abaixo seguem os flashcards:

USE AS TAGS:`;
                                                        navigator.clipboard.writeText(prompt);
                                                        alert('✅ Prompt copiado! Cole no ChatGPT ou Claude.');
                                                    }}
                                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-colors"
                                                >
                                                    📋 Copiar Prompt
                                                </button>
                                            </div>
                                        </div>
                                        <pre className={`bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 rounded text-xs overflow-x-auto leading-relaxed border border-gray-200 dark:border-gray-700 ${showIaPromptFull ? 'max-h-80' : 'max-h-40'} overflow-y-auto`}>
{`Preciso que você identifique os flashcards no texto fornecido e os transforme em um formato específico de texto estruturado.

FORMATO DE SAÍDA ESPERADO:

Cada flashcard deve seguir este padrão, com blocos separados apenas por espaço, sem caracteres:

Para flashcards de Pergunta e Resposta:

Pergunta: [texto da pergunta]

Resposta: [texto da resposta] [explicação opcional]

Tags: [tags separadas por vírgulas]

Para flashcards de Verdadeiro ou Falso:

Certo ou Errado: [afirmação]

Resposta: [Verdadeiro ou Falso]

Explicação: [explicação]

Tags: [tags separadas por vírgulas]

Para flashcards de Múltipla Escolha:

Questão: [enunciado da questão]

A) [alternativa A]

B) [alternativa B]

C) [alternativa C]

D) [alternativa D]

Resposta: [letra da alternativa correta]

Explicação: [explicação]

Tags: [tags separadas por vírgulas]

Para flashcards de Dicionário/Vocabulário:

Dicionário: [termo]

Significado: [definição]

Tags: [tags separadas por vírgulas]

Para flashcards de Situação-Problema:

Hipótese: [descrição do cenário]

Problema: [pergunta sobre o cenário]

Resposta: [resposta] [explicação]

Tags: [tags separadas por vírgulas]

Para flashcards de Hipótese/Caso de Estudo:

Hipótese: [descrição da hipótese ou caso]

Problema: [pergunta]

Resposta: [resposta] [explicação]

Tags: [tags separadas por vírgulas]

REGRAS IMPORTANTES:

1. Classifique cada flashcard no tipo mais adequado. Adapte se necessário.
2. Mantenha o conteúdo original, apenas reorganize no formato.
3. Separe cada flashcard com espaços, sem caracteres.
4. Use exatamente as palavras-chave especificadas (Pergunta:, Resposta:, etc.).
5. Se não houver explicação no original, você pode omitir o campo "Explicação:".
6. Retire as palavras e caracteres que não integrem os flashcards.
7. Nos de flashcards de Múltipla Escolha, acrescente a letra das alternativas com parêntese após a letra. Ex.: A), B), C), D).
8. Não escreva linha (---) para separar os flashcards.
9. As tags serão determinadas por mim.
10. Não use markdown. Deixe o texto limpo.
11. Adapte os flashcards que não corresponderem diretamente a algum formato indicado.
12. Para que o app identifique a modalidade do Flashcard, você deve organizar o texto e iniciar cada item do Flashcard em uma nova linha.

Abaixo seguem os flashcards:

USE AS TAGS:`}
                                        </pre>
                                    </div>

                                    <div className="mt-3 flex items-start gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                                        <span className="mt-0.5">ℹ️</span>
                                        <p>
                                            <strong>Como usar:</strong> Copie o prompt acima, cole no ChatGPT/Claude, depois cole seus flashcards do Anki onde está escrito "[COLE SEUS FLASHCARDS AQUI]". A IA converterá tudo automaticamente para o formato correto!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Solução de Problemas */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>⚠️</span> Solução de Problemas
                                </h3>

                                <div className="space-y-3">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                            "O arquivo TXT está vazio"
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            Verifique se o arquivo contém texto e não está em branco.
                                        </p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                            "Nenhum flashcard válido encontrado"
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            Certifique-se de que cada bloco começa com uma palavra-chave reconhecida (Pergunta:, Certo ou Errado:, etc.) e contém o campo "Resposta:".
                                        </p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                            Tipo detectado incorretamente
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            Verifique se a palavra-chave está exatamente como especificado (incluindo os dois pontos ":"). O sistema diferencia maiúsculas de minúsculas apenas na primeira letra.
                                        </p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">
                                            Alguns flashcards não foram importados
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            Flashcards sem o campo "Resposta:" ou com palavras-chave não reconhecidas são ignorados. Verifique o formato de cada bloco.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Diferenças CSV vs TXT Anki */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <span>🔀</span> CSV vs TXT Anki: Quando usar cada um?
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">📥 Importar CSV</h4>
                                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                            <li>✓ Flashcards do NotebookLM</li>
                                            <li>✓ Formato simples (2 colunas)</li>
                                            <li>✓ Detecção automática: Q&A ou Preencher Lacunas</li>
                                            <li>✓ Ideal para importações rápidas</li>
                                        </ul>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">📄 Importar TXT Anki</h4>
                                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                            <li>✓ Flashcards do Anki</li>
                                            <li>✓ Suporta 6 tipos diferentes</li>
                                            <li>✓ Campos adicionais (Explicação)</li>
                                            <li>✓ Ideal para conteúdo estruturado</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
    );
};
