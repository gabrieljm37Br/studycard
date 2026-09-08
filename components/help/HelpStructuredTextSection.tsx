import React from 'react';
import { HelpSectionProps } from './types';

export const HelpStructuredTextSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    const handleCopy = (text: string, msg = 'Copiado!') => {
        if (copyToClipboard) {
            copyToClipboard(text, msg);
        } else {
            navigator.clipboard.writeText(text);
            alert(msg);
        }
    };
    return (
                    <section id="texto-estruturado" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>📝</span> Colar texto estruturado (Gerador)
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                No <strong>Gerador de Flashcards</strong> você pode usar a opção <strong>“Colar texto estruturado”</strong> para criar cards a partir de texto já formatado. Use os prompts abaixo na IA de sua preferência para gerar blocos prontos e depois cole o resultado no gerador.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Prompt: Múltipla Escolha</h3>
                                        <button
                                            onClick={() => handleCopy(
`Crie flashcards de 'Múltipla Escolha' suficientes para memorizar o assunto do explicado.
1. Separe cada flashcard com espaços, sem caracteres.
2. Não escreva linha (---) para separar os flashcards, deixe o espaço em branco entre os flashcards.
3. Acrescente a letra das alternativas com parêntese apenas após a letra. Ex.: A), B), C), D)
4. Não enumere os flashcards.
5. Alterne as respostas de forma que o gabarito tenha variação das letras das respostas de forma equilibrada.
6. O formato do texto deve ser em um formato específico de texto estruturado.
7. Não use markdown. Deixe o texto 'limpo'.

FORMATO DE SAÍDA ESPERADO:
Questão: [enunciado da questão]
A) [alternativa A]
B) [alternativa B]
C) [alternativa C]
D) [alternativa D]
Resposta: [letra da alternativa correta]
Explicação: [explicação]
Tags: [tags separadas por vírgulas]`
                                        , '✅ Prompt copiado!')}
                                            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Peça para a IA gerar questões e respostas variando o gabarito.</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Prompt: Exemplo Prático</h3>
                                        <button
                                            onClick={() => handleCopy(
`Crie flashcards de 'Exemplo prático' suficientes para memorizar o assunto do explicado.
1. Separe cada flashcard com espaços, sem caracteres.
2. Não escreva linha (---) para separar os flashcards, deixe o espaço em branco entre os flashcards.
3. Não enumere os flashcards.
4. O formato do texto deve ser em um formato específico de texto estruturado.
5. Não use markdown. Deixe o texto 'limpo'.

FORMATO DE SAÍDA ESPERADO:
Hipótese: [descrição do cenário]
Problema: [pergunta sobre o cenário]
Resposta: [resposta] [explicação]
Tags: [tags separadas por vírgulas]`
                                        , '✅ Prompt copiado!')}
                                            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Use para casos e situações-problema.</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Prompt: Pergunta & Resposta</h3>
                                        <button
                                            onClick={() => handleCopy(
`Crie flashcards de 'Pergunta e Resposta' suficientes para memorizar o assunto do explicado.
1. Separe cada flashcard com espaços, sem caracteres.
2. Não escreva linha (---) para separar os flashcards, deixe o espaço em branco entre os flashcards.
3. Não enumere os flashcards.
4. O formato do texto deve ser em um formato específico de texto estruturado.
5. Não use markdown. Deixe o texto 'limpo'.

FORMATO DE SAÍDA ESPERADO:
Pergunta: [texto da pergunta]
Resposta: [texto da resposta] [explicação opcional]
Tags: [tags separadas por vírgulas]`
                                        , '✅ Prompt copiado!')}
                                            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Ideal para flashcards diretos de conceito.</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Prompt: Dicionário</h3>
                                        <button
                                            onClick={() => handleCopy(
`Crie flashcards de 'Dicionário' suficientes para memorizar o assunto do explicado.
1. Separe cada flashcard com espaços, sem caracteres.
2. Não escreva linha (---) para separar os flashcards, deixe o espaço em branco entre os flashcards.
3. Não enumere os flashcards.
4. O formato do texto deve ser em um formato específico de texto estruturado.
5. Não use markdown. Deixe o texto 'limpo'.

FORMATO DE SAÍDA ESPERADO:
Dicionário: [termo]
Significado: [definição]
Tags: [tags separadas por vírgulas]`
                                        , '✅ Prompt copiado!')}
                                            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Útil para glossários e vocabulário.</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Prompt: Verdadeiro ou Falso</h3>
                                        <button
                                            onClick={() => handleCopy(
`Crie flashcards de 'Verdadeiro ou Falso' suficientes para memorizar o conteúdo do pdf.
1. Separe cada flashcard com espaços, sem caracteres.
2. Não escreva linha (---) para separar os flashcards.
3. O formato do texto deve ser em um formato específico de texto estruturado.
4. Não use markdown. Deixe o texto 'limpo'.

FORMATO DE SAÍDA ESPERADO:
Certo ou Errado: [afirmação]
Resposta: [Verdadeiro ou Falso]
Explicação: [explicação]
Tags: [tags separadas por vírgulas]`
                                        , '✅ Prompt copiado!')}
                                            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Para afirmações rápidas com justificativa.</p>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Dica: após gerar o texto, copie tudo e use o botão <strong>“Colar texto estruturado”</strong> no Gerador para importar direto como flashcards.
                            </p>
                        </div>
                    </section>
    );
};
