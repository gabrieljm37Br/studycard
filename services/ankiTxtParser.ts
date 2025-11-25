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

/**
 * Extracts field value after a keyword (e.g., "Resposta:", "Explicação:")
 */
function extractField(text: string, keyword: string, endKeywords: string[] = []): string {
    // Create regex to match from keyword to either end of string or next keyword
    const keywordEscaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let pattern: string;
    if (endKeywords.length > 0) {
        const endPattern = endKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        pattern = `${keywordEscaped}\\s*([\\s\\S]*?)(?=${endPattern}|$)`;
    } else {
        pattern = `${keywordEscaped}\\s*([\\s\\S]*)`;
    }

    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);

    return match ? normalizeWhitespace(match[1]) : '';
}

/**
 * Parses a "Pergunta:" type card (Q&A format)
 */
function parsePerguntaCard(blockText: string): ParsedAnkiCard {
    const front = extractField(blockText, 'Pergunta:', ['Resposta:', 'Explicação:']);
    const back = extractField(blockText, 'Resposta:', ['Explicação:']);
    const explanation = extractField(blockText, 'Explicação:');

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
    const front = extractField(blockText, 'Certo ou Errado:', ['Resposta:', 'Explicação:']);
    const back = extractField(blockText, 'Resposta:', ['Explicação:']);
    const explanation = extractField(blockText, 'Explicação:');

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
 * Parses a "Questão:" type card (Multiple Choice format)
 * Preserves formatting of alternatives
 */
function parseQuestaoCard(blockText: string): ParsedAnkiCard {
    // Extract question and alternatives (everything between "Questão:" and "Resposta:")
    const questionPattern = /Questão:\s*([\s\S]*?)(?=Resposta:|$)/i;
    const questionMatch = blockText.match(questionPattern);

    let front = '';
    if (questionMatch) {
        // Preserve line breaks for alternatives but clean up spacing
        front = normalizeWhitespace(questionMatch[1], true);
    }

    const back = extractField(blockText, 'Resposta:', ['Explicação:']);
    const explanation = extractField(blockText, 'Explicação:');

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
 * Parses a "Dicionário:" type card (Dictionary format -> Q&A)
 */
function parseDicionarioCard(blockText: string): ParsedAnkiCard {
    const front = extractField(blockText, 'Dicionário:', ['Significado:', 'Explicação:']);
    const back = extractField(blockText, 'Significado:', ['Explicação:']);
    const explanation = extractField(blockText, 'Explicação:');

    return {
        type: CardMode.QA,
        front,
        back,
        explanation: explanation || undefined
    };
}

/**
 * Parses a "Situação-Problema:" or "Hipótese:" type card (Practical Example format)
 */
function parsePracticalCard(blockText: string, startKeyword: string): ParsedAnkiCard {
    // Extract the situation/hypothesis
    const situation = extractField(blockText, startKeyword, ['Questão:', 'Resposta:', 'Explicação:']);

    // Extract the question (if exists)
    const question = extractField(blockText, 'Questão:', ['Resposta:', 'Explicação:']);

    // Combine situation and question for the front
    const front = question
        ? `${situation}\n\n${question}`
        : situation;

    // Extract answer and explanation
    const back = extractField(blockText, 'Resposta:', ['Explicação:']);
    const explanation = extractField(blockText, 'Explicação:');

    return {
        type: CardMode.PracticalExample,
        front: normalizeWhitespace(front, true),
        back,
        explanation: explanation || undefined
    };
}

/**
 * Detects the card type based on the starting keyword
 */
function detectCardType(blockText: string): { type: string; keyword: string } | null {
    const trimmed = blockText.trim();

    // Order matters: check more specific patterns first
    if (/^Certo ou Errado:/i.test(trimmed)) {
        return { type: 'certo_errado', keyword: 'Certo ou Errado:' };
    }
    if (/^Pergunta:/i.test(trimmed)) {
        return { type: 'pergunta', keyword: 'Pergunta:' };
    }
    if (/^Questão:/i.test(trimmed)) {
        return { type: 'questao', keyword: 'Questão:' };
    }
    if (/^Dicionário:/i.test(trimmed)) {
        return { type: 'dicionario', keyword: 'Dicionário:' };
    }
    if (/^Situação-Problema:/i.test(trimmed)) {
        return { type: 'situacao', keyword: 'Situação-Problema:' };
    }
    if (/^Hipótese:/i.test(trimmed)) {
        return { type: 'hipotese', keyword: 'Hipótese:' };
    }

    return null;
}

/**
 * Splits the text file into individual card blocks
 * Each block starts with a recognized keyword
 */
function splitIntoBlocks(content: string): string[] {
    // Keywords that indicate the start of a new card
    const startKeywords = [
        'Pergunta:',
        'Certo ou Errado:',
        'Questão:',
        'Dicionário:',
        'Situação-Problema:',
        'Hipótese:'
    ];

    // Create a regex pattern that matches any of the start keywords
    const pattern = startKeywords
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    // Split on start keywords but keep the delimiter
    const regex = new RegExp(`(?=${pattern})`, 'i');
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
                card = parsePracticalCard(block, 'Situação-Problema:');
                break;
            case 'hipotese':
                card = parsePracticalCard(block, 'Hipótese:');
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
