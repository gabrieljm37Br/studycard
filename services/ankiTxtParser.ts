import { CardMode } from '../types';

export interface ParsedAnkiCard {
    type: CardMode;
    front: string;
    back: string;
    explanation?: string;
    options?: string[];
    correctAnswerIndex?: number;
    isTrue?: boolean;
    tags?: string[];
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

// Keyword patterns (accent tolerant)
const keywordPatterns = {
    pergunta: '(?:Pergunta:)',
    resposta: '(?:Resposta:)',
    explicacao: '(?:Explicacao:|Explicacao:|Explicação:)',
    questao: '(?:Questao:|Questao:|Questão:)',
    dicionario: '(?:Dicionario:|Dicionario:|Dicionário:)',
    significado: '(?:Significado:)',
    certoErrado: '(?:Certo ou Errado:)',
    situacao: '(?:Situacao[- ]?Problema:|Situacao[- ]?Problema:|Situação[- ]?Problema:)',
    hipotese: '(?:Hipotese:|Hipotese:|Hipótese:)',
    tags: '(?:Tags:|Etiquetas:)'
};

const startKeywordPatterns = [
    { type: 'certo_errado', pattern: keywordPatterns.certoErrado },
    { type: 'pergunta', pattern: keywordPatterns.pergunta },
    { type: 'questao', pattern: keywordPatterns.questao },
    { type: 'dicionario', pattern: keywordPatterns.dicionario },
    { type: 'situacao', pattern: keywordPatterns.situacao },
    { type: 'hipotese', pattern: keywordPatterns.hipotese },
];

function extractFieldByPattern(text: string, keywordPattern: string, endPatterns: string[] = []): string {
    const endPattern = endPatterns.length > 0 ? endPatterns.join('|') : '';
    const pattern = endPatterns.length > 0
        ? `${keywordPattern}\\s*([\\s\\S]*?)(?=${endPattern}|$)`
        : `${keywordPattern}\\s*([\\s\\S]*)`;

    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);
    return match ? normalizeWhitespace(match[1]) : '';
}

function parsePerguntaCard(blockText: string): ParsedAnkiCard {
    const front = extractFieldByPattern(blockText, keywordPatterns.pergunta, [keywordPatterns.resposta, keywordPatterns.explicacao, keywordPatterns.tags]);
    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    return { type: CardMode.QA, front, back, explanation: explanation || undefined, tags };
}

function parseCertoOuErradoCard(blockText: string): ParsedAnkiCard {
    const front = extractFieldByPattern(blockText, keywordPatterns.certoErrado, [keywordPatterns.resposta, keywordPatterns.explicacao, keywordPatterns.tags]);
    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    const isTrue = /certo|verdadeiro|true|v|sim/i.test(back.trim());
    return { type: CardMode.TrueFalse, front, back, explanation: explanation || undefined, isTrue, tags };
}

function parseQuestaoCard(blockText: string): ParsedAnkiCard {
    const questionPattern = new RegExp(`${keywordPatterns.questao}\\s*([\\s\\S]*?)(?=${keywordPatterns.resposta}|$)`, 'i');
    const questionMatch = blockText.match(questionPattern);

    let front = '';
    if (questionMatch) {
        front = normalizeWhitespace(questionMatch[1], true);
    }

    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao);

    let options: string[] = [];
    let questionText = '';
    let correctAnswerIndex = 0;

    if (front) {
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

    const answerTrimmed = back.trim().toLowerCase();
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

    // Extract tags
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;

    return {
        type: CardMode.MultipleChoice,
        front: questionText || front,
        back,
        explanation: explanation || undefined,
        options: options.length > 0 ? options : undefined,
        correctAnswerIndex: options.length > 0 ? correctAnswerIndex : undefined,
        tags
    };
}

function parseDicionarioCard(blockText: string): ParsedAnkiCard {
    const front = extractFieldByPattern(blockText, keywordPatterns.dicionario, [keywordPatterns.significado, keywordPatterns.explicacao, keywordPatterns.tags]);
    const back = extractFieldByPattern(blockText, keywordPatterns.significado, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    return { type: CardMode.Dictionary, front, back, explanation: explanation || undefined, tags };
}

function parsePracticalCard(blockText: string, startKeyword: string): ParsedAnkiCard {
    const situation = extractFieldByPattern(blockText, startKeyword, [keywordPatterns.questao, keywordPatterns.resposta, keywordPatterns.explicacao, keywordPatterns.tags]);
    const question = extractFieldByPattern(blockText, keywordPatterns.questao, [keywordPatterns.resposta, keywordPatterns.explicacao, keywordPatterns.tags]);
    const front = question ? `${situation}\n\n${question}` : situation;
    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao, keywordPatterns.tags]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao, [keywordPatterns.tags]);
    const tagsField = extractFieldByPattern(blockText, keywordPatterns.tags);
    const tags = tagsField ? tagsField.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined;
    return { type: CardMode.PracticalExample, front: normalizeWhitespace(front, true), back, explanation: explanation || undefined, tags };
}

function detectCardType(blockText: string): { type: string; keyword: string } | null {
    const trimmed = blockText.trim();
    const normalizedStart = trimmed.replace(/^[\uFEFF"'“”‘’\s]+/, '');

    for (const { type, pattern } of startKeywordPatterns) {
        const regex = new RegExp(`^${pattern}`, 'i');
        if (regex.test(normalizedStart)) {
            return { type, keyword: pattern };
        }
    }
    return null;
}

function splitIntoBlocks(content: string): string[] {
    const pattern = startKeywordPatterns.map(k => k.pattern).join('|');
    const regex = new RegExp(`(?=[\\s"'“”‘’]*(${pattern}))`, 'gi');
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
            error: 'Nenhum flashcard válido encontrado. Certifique-se de que o arquivo contém cards com palavras-chave reconhecidas (Pergunta:, Certo ou Errado:, etc.)'
        };
    }

    return { valid: true };
}
