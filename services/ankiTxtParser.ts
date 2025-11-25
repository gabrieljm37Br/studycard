import { CardMode } from '../types';

/**
 * Interface for parsed Anki card data
 */
export interface ParsedAnkiCard {
    type: CardMode;
    front: string;
    back: string;
    explanation?: string;
    options?: string[];
    correctAnswerIndex?: number;
    isTrue?: boolean;
}

/**
 * Normalizes whitespace in text: removes excessive spaces, tabs, and newlines
 * while preserving intentional line breaks in multi-choice alternatives
 */
function normalizeWhitespace(text: string, preserveLineBreaks: boolean = false): string {
    if (preserveLineBreaks) {
        // For multi-choice, preserve line breaks but clean up each line
        return text
            .split(/\r?\n/)
            .map(line => line.replace(/\s+/g, ' ').trim())
            .filter(line => line.length > 0)
            .join('\n');
    }

    // Default: collapse all whitespace to single spaces
    return text.replace(/\s+/g, ' ').trim();
}

// Keyword patterns that tolerate common accent/spacing variations
const keywordPatterns = {
    pergunta: '(?:Pergunta:)',
    resposta: '(?:Resposta:)',
    explicacao: '(?:Explicacao:|Explicação:)',
    questao: '(?:Questao:|Questão:)',
    dicionario: '(?:Dicionario:|Dicionário:)',
    significado: '(?:Significado:)',
    certoErrado: '(?:Certo ou Errado:)',
    situacao: '(?:Situac[aã]o[- ]?Problema:|Situação[- ]?Problema:)',
    hipotese: '(?:Hipotese:|Hipótese:)'
};

/**
 * Extracts field value after a keyword pattern (supports diacritics/case)
 */
function extractFieldByPattern(text: string, keywordPattern: string, endPatterns: string[] = []): string {
    let pattern: string;
    if (endPatterns.length > 0) {
        const endPattern = endPatterns.join('|');
        pattern = `${keywordPattern}\\s*([\\s\\S]*?)(?=${endPattern}|$)`;
    } else {
        pattern = `${keywordPattern}\\s*([\\s\\S]*)`;
    }

    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);

    return match ? normalizeWhitespace(match[1]) : '';
}

/**
 * Parses a "Pergunta:" type card (Q&A format)
 */
function parsePerguntaCard(blockText: string): ParsedAnkiCard {
    const front = extractFieldByPattern(blockText, keywordPatterns.pergunta, [keywordPatterns.resposta, keywordPatterns.explicacao]);
    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao);

    return {
        type: CardMode.QA,
        front,
        back,
        explanation: explanation || undefined
    };
}

/**
 * Parses a "Certo ou Errado:" type card (True/False format)
 */
function parseCertoOuErradoCard(blockText: string): ParsedAnkiCard {
    const front = extractFieldByPattern(blockText, keywordPatterns.certoErrado, [keywordPatterns.resposta, keywordPatterns.explicacao]);
    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao);

    const isTrue = /certo|verdadeiro|true|v|sim/i.test(back.trim());

    return {
        type: CardMode.TrueFalse,
        front,
        back,
        explanation: explanation || undefined,
        isTrue
    };
}

/**
 * Parses a "Questao:" type card (Multiple Choice format)
 * Preserves formatting of alternatives
 */
function parseQuestaoCard(blockText: string): ParsedAnkiCard {
    // Extract question and alternatives (everything between "Questao:" and "Resposta:")
    const questionPattern = new RegExp(`${keywordPatterns.questao}\\s*([\\s\\S]*?)(?=${keywordPatterns.resposta}|$)`, 'i');
    const questionMatch = blockText.match(questionPattern);

    let front = '';
    if (questionMatch) {
        // Preserve line breaks for alternatives but clean up spacing
        front = normalizeWhitespace(questionMatch[1], true);
    }

    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao);

    let options: string[] = [];
    let questionText = '';
    let correctAnswerIndex = 0;

    if (front) {
        // Attempt to split question and options
        // Strategy: Look for lines starting with a), b), etc.
        const lines = front.split('\n');
        const optionRegex = /^([a-z]\)|\d+\.)\s*(.+)/i;

        const firstOptionIndex = lines.findIndex(line => optionRegex.test(line.trim()));

        if (firstOptionIndex !== -1) {
            // Extract options
            options = lines
                .slice(firstOptionIndex)
                .filter(line => optionRegex.test(line.trim()))
                .map(line => line.replace(/^([a-z]\)|\d+\.)\s*/i, '').trim());

            // Extract question (everything before first option)
            questionText = lines.slice(0, firstOptionIndex).join('\n').trim();
        } else {
            questionText = front;
        }
    }

    // Parse correct answer index
    const answerTrimmed = back.trim().toLowerCase();

    // 1. Check for single letter answer like 'a', 'b)' or 'a.'
    const letterMatch = answerTrimmed.match(/^([a-z])\)?\.?$/);
    if (letterMatch) {
        correctAnswerIndex = letterMatch[1].charCodeAt(0) - 97; // a=0, b=1
    } else {
        // 2. Check for format "a) Answer Text" or "a. Answer Text"
        const letterStartMatch = answerTrimmed.match(/^([a-z])[\)\.]\s+/);
        if (letterStartMatch) {
            correctAnswerIndex = letterStartMatch[1].charCodeAt(0) - 97;
        } else {
            // 3. Check for number answer like '1', '2)' or '1.'
            const numberMatch = answerTrimmed.match(/^(\d+)\)?\.?$/);
            if (numberMatch) {
                correctAnswerIndex = parseInt(numberMatch[1]) - 1;
            } else {
                // 4. Check for format "1. Answer Text"
                const numberStartMatch = answerTrimmed.match(/^(\d+)[\)\.]\s+/);
                if (numberStartMatch) {
                    correctAnswerIndex = parseInt(numberStartMatch[1]) - 1;
                } else {
                    // 5. Fallback: Try to match answer text against options
                    // We check if the option text is contained in the answer or vice versa
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

    // Validate index
    if (options.length > 0 && (correctAnswerIndex < 0 || correctAnswerIndex >= options.length)) {
        correctAnswerIndex = 0; // Fallback
    }

    return {
        type: CardMode.MultipleChoice,
        front: questionText || front,
        back,
        explanation: explanation || undefined,
        options: options.length > 0 ? options : undefined,
        correctAnswerIndex: options.length > 0 ? correctAnswerIndex : undefined
    };
}

/**
 * Parses a "Dicionario:" type card (Dictionary format -> Q&A)
 */
function parseDicionarioCard(blockText: string): ParsedAnkiCard {
    const front = extractFieldByPattern(blockText, keywordPatterns.dicionario, [keywordPatterns.significado, keywordPatterns.explicacao]);
    const back = extractFieldByPattern(blockText, keywordPatterns.significado, [keywordPatterns.explicacao]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao);

    return {
        type: CardMode.QA,
        front,
        back,
        explanation: explanation || undefined
    };
}

/**
 * Parses a "Situacao-Problema:" or "Hipotese:" type card (Practical Example format)
 */
function parsePracticalCard(blockText: string, startKeyword: string): ParsedAnkiCard {
    // Extract the situation/hypothesis
    const situation = extractFieldByPattern(blockText, startKeyword, [keywordPatterns.questao, keywordPatterns.resposta, keywordPatterns.explicacao]);

    // Extract the question (if exists)
    const question = extractFieldByPattern(blockText, keywordPatterns.questao, [keywordPatterns.resposta, keywordPatterns.explicacao]);

    // Combine situation and question for the front
    const front = question
        ? `${situation}\n\n${question}`
        : situation;

    // Extract answer and explanation
    const back = extractFieldByPattern(blockText, keywordPatterns.resposta, [keywordPatterns.explicacao]);
    const explanation = extractFieldByPattern(blockText, keywordPatterns.explicacao);

    return {
        type: CardMode.PracticalExample,
        front: normalizeWhitespace(front, true),
        back,
        explanation: explanation || undefined
    };
}

const startKeywordPatterns = [
    { type: 'certo_errado', pattern: keywordPatterns.certoErrado },
    { type: 'pergunta', pattern: keywordPatterns.pergunta },
    { type: 'questao', pattern: keywordPatterns.questao },
    { type: 'dicionario', pattern: keywordPatterns.dicionario },
    { type: 'situacao', pattern: keywordPatterns.situacao },
    { type: 'hipotese', pattern: keywordPatterns.hipotese },
];

/**
 * Detects the card type based on the starting keyword
 */
function detectCardType(blockText: string): { type: string; keyword: string } | null {
    const trimmed = blockText.trim();

    for (const { type, pattern } of startKeywordPatterns) {
        const regex = new RegExp(`^${pattern}`, 'i');
        if (regex.test(trimmed)) {
            return { type, keyword: pattern };
        }
    }

    return null;
}

/**
 * Splits the text file into individual card blocks
 * Each block starts with a recognized keyword
 */
function splitIntoBlocks(content: string): string[] {
    // Create a regex pattern that matches any of the start keywords (diacritics tolerant)
    const pattern = startKeywordPatterns.map(k => k.pattern).join('|');

    // Split on start keywords but keep the delimiter
    const regex = new RegExp(`(?=${pattern})`, 'gi');
    const blocks = content.split(regex);

    // Filter out empty blocks and trim
    return blocks
        .map(block => block.trim())
        .filter(block => block.length > 0 && detectCardType(block) !== null);
}

/**
 * Main parser function: parses Anki TXT file content into structured cards
 */
export function parseAnkiTxtFile(content: string): ParsedAnkiCard[] {
    if (!content || content.trim().length === 0) {
        return [];
    }

    const blocks = splitIntoBlocks(content);
    const parsedCards: ParsedAnkiCard[] = [];

    for (const block of blocks) {
        const detection = detectCardType(block);

        if (!detection) {
            continue; // Skip unrecognized blocks
        }

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

        // Validate that card has required fields
        if (card && card.front && card.back) {
            parsedCards.push(card);
        }
    }

    return parsedCards;
}

/**
 * Validates Anki TXT content before parsing
 */
export function validateAnkiTxtContent(content: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
        return { valid: false, error: 'O arquivo TXT esta vazio' };
    }

    const blocks = splitIntoBlocks(content);

    if (blocks.length === 0) {
        return {
            valid: false,
            error: 'Nenhum flashcard valido encontrado. Certifique-se de que o arquivo contem cards com palavras-chave reconhecidas (Pergunta:, Certo ou Errado:, etc.)'
        };
    }

    return { valid: true };
}
