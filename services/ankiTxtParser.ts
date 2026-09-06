import { CardMode } from '../types';

export interface ParsedAnkiCard {
    type: CardMode;
    front: string;
    back: string;
    explanation?: string;
    problem?: string;
    practicalQuestion?: string;
    solution?: string;
    options?: string[];
    correctAnswerIndex?: number;
    isTrue?: boolean;
    tags?: string[];
    term?: string;
    definition?: string;
}

function normalizeWhitespace(text: string, preserveLineBreaks: boolean = false): string {
    if (preserveLineBreaks) {
        return text
            .split(/\r?\n/)
            .map(line => line.replace(/\s+/g, ' ').trim())
            .filter(line => line.length > 0)
            .join('\n');
    }
    return text.replace(/\s+/g, ' ').trim();
}

function escapeLatexAttr(latex: string): string {
    return latex.replace(/"/g, '&quot;');
}

/**
 * Converte delimitadores LaTeX ($...$ ou $$...$$) em spans compatíveis com KaTeX,
 * usados pelo editor e pelo viewer. Evita quebrar textos com número ímpar de
 * cifrões para não corromper strings que tenham $ literal.
 */
function embedLatex(text: string): string {
    if (!text) return text;

    let output = text;

    // Blocos: $$...$$
    output = output.replace(/\$\$(.+?)\$\$/gs, (_match, expr) =>
        `<span data-type="block-math" data-latex="${escapeLatexAttr(expr.trim())}"></span>`
    );

    // Inline: $...$
    const dollarCount = (output.match(/\$/g) || []).length;
    if (dollarCount >= 2 && dollarCount % 2 === 0) {
        output = output.replace(/\$(.+?)\$/gs, (_match, expr) => {
            // Ajuste: Escapar sequências de 2 ou mais underscores para evitar erro de subscrito
            // Ex: "___" vira "\_\_\_"
            const safeExpr = expr.replace(/(__+)/g, (match) => {
                return match.split('').map(() => '\\_').join('');
            });
            return `<span data-latex="${escapeLatexAttr(safeExpr.trim())}"></span>`;
        });
    }

    return output;
}

// Keyword patterns (accent tolerant)
const keywordPatterns = {
    pergunta: '(?:Pergunta:)',
    perguntaLatex: '(?:Pergunta\\s+Latex:|Pergunta\\s+LaTeX:)',
    resposta: '(?:Resposta:)',
    respostaLatex: '(?:Resposta\\s+Latex:|Resposta\\s+LaTeX:)',
    explicacao: '(?:Explicacao:|Explicação:|Explicaç\\u00E3o:)',
    questao: '(?:Questao:|Questão:|Quest\\u00E3o:)',
    questaoLatex: '(?:Questao\\s+Latex:|Questao\\s+LaTeX:|Questão\\s+Latex:|Questão\\s+LaTeX:|Quest\\u00E3o\\s+Latex:)',
    dicionario: '(?:Dicionario:|Dicionário:|Dicion\\u00E1rio:|Termo:)',
    significado: '(?:Significado:|Definicao:|Definição:|Definiç\\u00E3o:)',
    certoErrado: '(?:Certo ou Errado:)',
    situacao: '(?:Situacao[- ]?Problema:|Situação[- ]?Problema:|Situaç\\u00E3o[- ]?Problema:)',
    problema: '(?:Problema:)',
    hipotese: '(?:Hipotese:|Hipótese:|Hip\\u00F3tese:)',
    tags: '(?:Tags:|Etiquetas:)',
    lacuna: '(?:Lacuna:|Lacunas:|Lacuna:)',
    opcaoLatex: '(?:Opcao\\s+Latex:|Opcao\\s+LaTeX:|Opção\\s+Latex:|Opção\\s+LaTeX:|Opç\\u00E3o\\s+Latex:)',
    // New patterns for structure robustness
    opcoes: '(?:Opcoes:|Opções:|Opç\\u00F5es:)'
};

const startKeywordPatterns = [
    { type: 'certo_errado', pattern: keywordPatterns.certoErrado },
    { type: 'pergunta', pattern: keywordPatterns.pergunta },
    { type: 'pergunta', pattern: keywordPatterns.perguntaLatex },
    { type: 'questao', pattern: keywordPatterns.questao },
    { type: 'questao', pattern: keywordPatterns.questaoLatex },
    { type: 'dicionario', pattern: keywordPatterns.dicionario },
    { type: 'situacao', pattern: keywordPatterns.situacao },
    { type: 'hipotese', pattern: keywordPatterns.hipotese },
    { type: 'lacuna', pattern: keywordPatterns.lacuna },
];

function extractFieldByPattern(text: string, keywordPattern: string, endPatterns: string[] = [], preserveLineBreaks: boolean = false): string {
    const groupedEndPatterns = endPatterns.map(p => `(?:${p})`);
    const endPattern = groupedEndPatterns.length > 0 ? groupedEndPatterns.join('|') : '';
    const pattern = endPatterns.length > 0
        ? `${keywordPattern}\\s*([\\s\\S]*?)(?=${endPattern}|$)`
        : `${keywordPattern}\\s*([\\s\\S]*)`;

    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);
    return match ? normalizeWhitespace(match[1], preserveLineBreaks) : '';
}

function wrapLatexSpan(text: string, display: boolean = false): string {
    if (!text) return text;
    return display
        ? `<span data-type="block-math" data-latex="${escapeLatexAttr(text.trim())}"></span>`
        : `<span data-latex="${escapeLatexAttr(text.trim())}"></span>`;
}

function parsePerguntaCard(blockText: string): ParsedAnkiCard {
    const isFrontLatex = new RegExp(keywordPatterns.perguntaLatex, 'i').test(blockText);
    const isBackLatex = new RegExp(keywordPatterns.respostaLatex, 'i').test(blockText);
    const frontRaw = extractFieldByPattern(blockText, `(?:${keywordPatterns.pergunta}|${keywordPatterns.perguntaLatex})`, [keywordPatterns.resposta, keywordPatterns.respostaLatex, keywordPatterns.opcaoLatex, keywordPatterns.explicacao, keywordPatterns.tags]);
    const backRaw = extractFieldByPattern(blockText, `(?:${keywordPatterns.resposta}|${keywordPatterns.respostaLatex})`, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanationRaw = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    return {
        type: CardMode.QA,
        front: isFrontLatex ? wrapLatexSpan(frontRaw) : embedLatex(frontRaw),
        back: isBackLatex ? wrapLatexSpan(backRaw) : embedLatex(backRaw),
        explanation: explanationRaw ? embedLatex(explanationRaw) : undefined,
        tags
    };
}

function parseCertoOuErradoCard(blockText: string): ParsedAnkiCard {
    const frontRaw = extractFieldByPattern(blockText, keywordPatterns.certoErrado, [keywordPatterns.resposta, keywordPatterns.respostaLatex, keywordPatterns.opcaoLatex, keywordPatterns.explicacao, keywordPatterns.tags]);
    const backRaw = extractFieldByPattern(blockText, `(?:${keywordPatterns.resposta}|${keywordPatterns.respostaLatex})`, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanationRaw = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    const isTrue = /certo|verdadeiro|true|v|sim/i.test(backRaw.trim());
    return {
        type: CardMode.TrueFalse,
        front: embedLatex(frontRaw),
        back: embedLatex(backRaw),
        explanation: explanationRaw ? embedLatex(explanationRaw) : undefined,
        isTrue,
        tags
    };
}

function parseQuestaoCard(blockText: string): ParsedAnkiCard {
    // Adicionado suporte para "Opcao LaTeX:" no lookahead para evitar captura excessiva
    const questionPattern = new RegExp(`(?:${keywordPatterns.questao}|${keywordPatterns.questaoLatex})\\s*([\\s\\S]*?)(?=(?:${keywordPatterns.opcoes}|${keywordPatterns.opcaoLatex}|${keywordPatterns.resposta}|${keywordPatterns.respostaLatex})|$)`, 'i');
    const questionMatch = blockText.match(questionPattern);
    const isQuestionLatex = new RegExp(keywordPatterns.questaoLatex, 'i').test(blockText);
    const isAnswerLatex = new RegExp(keywordPatterns.respostaLatex, 'i').test(blockText);

    let front = '';
    if (questionMatch) {
        front = normalizeWhitespace(questionMatch[1], true);
    }

    const backRaw = extractFieldByPattern(blockText, `(?:${keywordPatterns.resposta}|${keywordPatterns.respostaLatex})`, [keywordPatterns.explicacao]);
    const explanationRaw = extractFieldByPattern(blockText, keywordPatterns.explicacao);

    let options: string[] = [];
    const explicitLatexOptions: string[] = [];
    let questionText = '';
    let correctAnswerIndex = 0;

    // Verificar se há bloco explícito de opções (Opcoes: ...)
    const opcoesExplictRaw = extractFieldByPattern(blockText, keywordPatterns.opcoes, [keywordPatterns.resposta, keywordPatterns.respostaLatex, keywordPatterns.explicacao, keywordPatterns.tags], true);

    if (opcoesExplictRaw) {
        // Se temos bloco Opcoes, parsear linhas A) ...
        const lines = opcoesExplictRaw.split('\n');
        const optionRegex = /^([a-z]\)|\d+\.)\s*(.+)/i;
        options = lines
            .filter(line => optionRegex.test(line.trim()))
            .map(line => line.replace(/^([a-z]\)|\d+\.)\s*/i, '').trim());

        questionText = front;
    } else if (front) {
        // Tentar extrair do front (estilo legado: pergunta e opções misturadas)
        const lines = front.split('\n');
        const optionRegex = /^([a-z]\)|\d+\.)\s*(.+)/i;
        const firstOptionIndex = lines.findIndex(line => optionRegex.test(line.trim()));

        if (firstOptionIndex !== -1) {
            options = lines
                .slice(firstOptionIndex)
                .filter(line => optionRegex.test(line.trim()))
                .map(line => line.replace(/^([a-z]\)|\d+\.)\s*/i, '').trim());
            questionText = lines.slice(0, firstOptionIndex).join('\n').trim();
        } else {
            questionText = front;
        }
    }

    const answerTrimmed = backRaw.trim().toLowerCase();
    const letterMatch = answerTrimmed.match(/^([a-z])\)?\.?$/);
    if (letterMatch) {
        correctAnswerIndex = letterMatch[1].charCodeAt(0) - 97;
    } else {
        const letterStartMatch = answerTrimmed.match(/^([a-z])[\)\.]\s+/);
        if (letterStartMatch) {
            correctAnswerIndex = letterStartMatch[1].charCodeAt(0) - 97;
        } else {
            const numberMatch = answerTrimmed.match(/^(\d+)\)?\.?$/);
            if (numberMatch) {
                correctAnswerIndex = parseInt(numberMatch[1]) - 1;
            } else {
                const numberStartMatch = answerTrimmed.match(/^(\d+)[\)\.]\s+/);
                if (numberStartMatch) {
                    correctAnswerIndex = parseInt(numberStartMatch[1]) - 1;
                } else {
                    const index = options.findIndex(opt => {
                        const optClean = opt.toLowerCase();
                        return optClean === answerTrimmed ||
                            (answerTrimmed.length > 5 && optClean.includes(answerTrimmed)) ||
                            (optClean.length > 5 && answerTrimmed.includes(optClean));
                    });
                    if (index !== -1) {
                        correctAnswerIndex = index;
                    }
                }
            }
        }
    }

    if (options.length > 0 && (correctAnswerIndex < 0 || correctAnswerIndex >= options.length)) {
        correctAnswerIndex = 0;
    }

    // Opções explícitas usando "Opcao LaTeX:"
    const opcaoLatexRegex = new RegExp(`(?:^|\\n)\\s*(?:[-•]\\s*)?${keywordPatterns.opcaoLatex}\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:[-•]\\s*)?${keywordPatterns.opcaoLatex}|${keywordPatterns.resposta}|${keywordPatterns.respostaLatex}|$))`, 'gi');
    let opcaoMatch;
    while ((opcaoMatch = opcaoLatexRegex.exec(blockText)) !== null) {
        const optText = normalizeWhitespace(opcaoMatch[1], true);
        if (optText) explicitLatexOptions.push(optText);
    }
    if (explicitLatexOptions.length > 0) {
        options = options.concat(explicitLatexOptions.map(o => wrapLatexSpan(o)));
    }

    // Extract tags
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;

    const embeddedFront = isQuestionLatex ? wrapLatexSpan(questionText || front) : embedLatex(questionText || front);
    const embeddedBack = isAnswerLatex ? wrapLatexSpan(backRaw) : embedLatex(backRaw);
    const embeddedExplanation = explanationRaw ? embedLatex(explanationRaw) : undefined;
    const embeddedOptions = options.length > 0 ? options.map(opt => embedLatex(opt)) : undefined;

    // Ajuste para 4 opções: truncar ou preencher
    let finalOptions = embeddedOptions;
    if (embeddedOptions) {
        const padded = [...embeddedOptions];
        while (padded.length < 4) padded.push('');
        finalOptions = padded.slice(0, 4);
        if (correctAnswerIndex >= finalOptions.length) correctAnswerIndex = 0;
    }

    return {
        type: CardMode.MultipleChoice,
        front: embeddedFront,
        back: embeddedBack,
        explanation: embeddedExplanation,
        options: finalOptions,
        correctAnswerIndex: finalOptions ? correctAnswerIndex : undefined,
        tags
    };
}

function parseDicionarioCard(blockText: string): ParsedAnkiCard {
    const frontRaw = extractFieldByPattern(blockText, keywordPatterns.dicionario, [keywordPatterns.significado, keywordPatterns.explicacao, keywordPatterns.tags]);
    const backRaw = extractFieldByPattern(blockText, keywordPatterns.significado, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanationRaw = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    return {
        type: CardMode.Dictionary,
        // Dicionário Map: front -> term, back -> definition
        front: embedLatex(frontRaw),
        back: embedLatex(backRaw),
        explanation: explanationRaw ? embedLatex(explanationRaw) : undefined,
        term: embedLatex(frontRaw),
        definition: embedLatex(backRaw),
        tags
    };
}

function parseLacunaCard(blockText: string): ParsedAnkiCard {
    const frontRaw = extractFieldByPattern(blockText, keywordPatterns.lacuna, [keywordPatterns.resposta, keywordPatterns.respostaLatex, keywordPatterns.opcaoLatex, keywordPatterns.explicacao, keywordPatterns.tags]);
    const backRaw = extractFieldByPattern(blockText, `(?:${keywordPatterns.resposta}|${keywordPatterns.respostaLatex})`, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanationRaw = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    return {
        type: CardMode.FillInTheBlank,
        front: embedLatex(frontRaw),
        back: embedLatex(backRaw),
        explanation: explanationRaw ? embedLatex(explanationRaw) : undefined,
        tags
    };
}

function parsePracticalCard(blockText: string, startKeyword: string): ParsedAnkiCard {
    const situation = extractFieldByPattern(blockText, startKeyword, [keywordPatterns.problema, keywordPatterns.questao, keywordPatterns.resposta, keywordPatterns.explicacao, keywordPatterns.tags], true);
    const question =
        extractFieldByPattern(blockText, keywordPatterns.problema, [keywordPatterns.questao, keywordPatterns.resposta, keywordPatterns.respostaLatex, keywordPatterns.opcaoLatex, keywordPatterns.explicacao, keywordPatterns.tags], true) ||
        extractFieldByPattern(blockText, `(?:${keywordPatterns.questao}|${keywordPatterns.questaoLatex})`, [keywordPatterns.resposta, keywordPatterns.respostaLatex, keywordPatterns.opcaoLatex, keywordPatterns.explicacao, keywordPatterns.tags], true);
    const problemText = normalizeWhitespace(situation, true);
    const questionText = normalizeWhitespace(question, true);
    const front = [problemText, questionText].filter(Boolean).join('\n\n') || problemText;
    const backRaw = extractFieldByPattern(blockText, `(?:${keywordPatterns.resposta}|${keywordPatterns.respostaLatex})`, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanationRaw = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    return {
        type: CardMode.PracticalExample,
        front: embedLatex(normalizeWhitespace(front, true)),
        back: embedLatex(backRaw),
        explanation: explanationRaw ? embedLatex(explanationRaw) : undefined,
        problem: problemText ? embedLatex(problemText) : undefined,
        practicalQuestion: questionText ? embedLatex(questionText) : undefined,
        solution: backRaw ? embedLatex(backRaw) : undefined,
        tags
    };
}

function detectCardType(blockText: string): { type: string; keyword: string } | null {
    const trimmed = blockText.trim();
    // Limpar BOM e caracteres invisíveis ou quotes inteligentes
    // \uFEFF = BOM, \u201C/\u201D = Smart double quotes, \u2018/\u2019 = Smart single quotes
    const normalizedStart = trimmed.replace(/^[\uFEFF"'\u201C\u201D\u2018\u2019\s]+/, '');

    for (const { type, pattern } of startKeywordPatterns) {
        const regex = new RegExp(`^(?:${pattern})`, 'i');
        if (regex.test(normalizedStart)) {
            return { type, keyword: pattern };
        }
    }
    return null;
}

function splitIntoBlocks(content: string): string[] {
    const pattern = startKeywordPatterns.map(k => `(?:${k.pattern})`).join('|');
    // Regex para split (lookahead positivas para palavras chaves)
    const regex = new RegExp(`(?=[\\s"'\u201C\u201D\u2018\u2019]*(?:${pattern}))`, 'gi');
    const blocks = content.split(regex);

    return blocks
        .map(block => block.trim())
        .filter(block => block.length > 0 && detectCardType(block) !== null);
}

export function parseAnkiTxtFile(content: string): ParsedAnkiCard[] {
    if (!content || content.trim().length === 0) {
        return [];
    }

    const blocks = splitIntoBlocks(content);
    const parsedCards: ParsedAnkiCard[] = [];

    for (const block of blocks) {
        const detection = detectCardType(block);
        if (!detection) continue;

        let card: ParsedAnkiCard | null = null;
        switch (detection.type) {
            case 'pergunta':
                card = parsePerguntaCard(block);
                break;
            case 'certo_errado':
                card = parseCertoOuErradoCard(block);
                break;
            case 'questao':
                card = parseQuestaoCard(block);
                break;
            case 'dicionario':
                card = parseDicionarioCard(block);
                break;
            case 'situacao':
                card = parsePracticalCard(block, keywordPatterns.situacao);
                break;
            case 'hipotese':
                card = parsePracticalCard(block, keywordPatterns.hipotese);
                break;
            case 'lacuna':
                card = parseLacunaCard(block);
                break;
        }

        if (card && card.front && card.back) {
            parsedCards.push(card);
        }
    }

    return parsedCards;
}

export function validateAnkiTxtContent(content: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
        return { valid: false, error: 'O arquivo TXT está vazio' };
    }

    const blocks = splitIntoBlocks(content);
    if (blocks.length === 0) {
        return {
            valid: false,
            error: 'Nenhum flashcard válido encontrado. Certifique-se de que o arquivo contém cards com palavras-chave reconhecidas (Pergunta:, Questão:, Dicionário:, Certo ou Errado:, Lacuna:, etc.)'
        };
    }

    return { valid: true };
}
