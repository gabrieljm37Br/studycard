import { CardMode } from '../types';

/**
 * Interface for parsed CSV card data
 */
export interface ParsedCard {
    front: string;
    back: string;
    type: CardMode;
}

/**
 * Detects the card type based on the front content
 * @param front - The front/question text of the card
 * @returns CardMode.FillInTheBlank if contains underscores, otherwise CardMode.QA
 */
export function detectCardType(front: string): CardMode {
    // Check if the front contains a sequence of underscores (cloze pattern)
    const hasUnderscores = /_+/.test(front);

    return hasUnderscores ? CardMode.FillInTheBlank : CardMode.QA;
}

/**
 * Parses a CSV line handling quoted fields properly
 * @param line - A single CSV line
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote inside quoted field
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // Field separator (only if not inside quotes)
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Add the last field
    fields.push(currentField.trim());

    return fields;
}

/**
 * Parses CSV content from NotebookLM export
 * @param csvContent - Raw CSV file content as string
 * @returns Array of parsed cards with detected types
 */
export function parseNotebookLMCSV(csvContent: string): ParsedCard[] {
    const lines = csvContent.split(/\r?\n/);
    const parsedCards: ParsedCard[] = [];

    for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) {
            continue;
        }

        const fields = parseCSVLine(line);

        // Ensure we have at least 2 fields (front and back)
        if (fields.length >= 2) {
            const front = fields[0];
            const back = fields[1];

            // Skip if either field is empty
            if (!front || !back) {
                continue;
            }

            const type = detectCardType(front);

            parsedCards.push({
                front,
                back,
                type,
            });
        }
    }

    return parsedCards;
}

/**
 * Validates CSV content before parsing
 * @param csvContent - Raw CSV file content
 * @returns Object with validation result and error message if invalid
 */
export function validateCSVContent(csvContent: string): { valid: boolean; error?: string } {
    if (!csvContent || csvContent.trim().length === 0) {
        return { valid: false, error: 'O arquivo CSV está vazio' };
    }

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
        return { valid: false, error: 'O arquivo CSV não contém dados válidos' };
    }

    // Check if at least one line has the expected format
    let hasValidLine = false;
    for (const line of lines) {
        const fields = parseCSVLine(line);
        if (fields.length >= 2 && fields[0] && fields[1]) {
            hasValidLine = true;
            break;
        }
    }

    if (!hasValidLine) {
        return { valid: false, error: 'O arquivo CSV não contém linhas válidas com 2 colunas (Frente, Verso)' };
    }

    return { valid: true };
}
