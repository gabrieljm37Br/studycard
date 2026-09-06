import { supabase } from './supabaseClient';
import { CardMode, FeedbackStatus } from '../types';
import type { FlashcardData, WebSource } from '../types';

/**
 * Extrai a mensagem de erro específica retornada pelo corpo JSON da Edge Function
 */
const extractEdgeFunctionError = async (error: any, fallback: string): Promise<string> => {
  if (error) {
    if (typeof error.context?.json === 'function') {
      try {
        const errorJson = await error.context.json();
        if (errorJson?.error) return errorJson.error;
      } catch {
        // ignora se falhar parsing
      }
    }
    if (error.message) return error.message;
  }
  return fallback;
};

/**
 * Generates flashcards using web search for topic-based generation via Supabase Edge Function
 */
export const generateFlashcardsWithSearch = async (topic: string, mode: CardMode): Promise<FlashcardData[]> => {
  const { data, error } = await supabase.functions.invoke('generate-flashcards', {
    body: {
      action: 'generateWithSearch',
      topic,
      mode,
    },
  });

  if (error) {
    const errorMsg = await extractEdgeFunctionError(error, "Não foi possível gerar os flashcards com pesquisa.");
    console.error("Erro ao invocar generate-flashcards com busca:", errorMsg);
    throw new Error(errorMsg);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const rawCards = data?.flashcards || [];
  const sources: WebSource[] = data?.sources || [];

  return rawCards.map((card: any) => {
    const baseCard: any = {
      ...card,
      id: crypto.randomUUID(),
      mode: mode,
      feedback: FeedbackStatus.Unseen,
      sources: sources,
    };

    if (mode === CardMode.FillInTheBlank) {
      baseCard.question = card.sentence || card.question;
      baseCard.answer = card.correctAnswer || card.answer;
    }

    if (mode === CardMode.Dictionary) {
      baseCard.term = card.term;
      baseCard.definition = card.definition;
    }

    return baseCard;
  });
};

/**
 * Generates flashcards based on text content via Supabase Edge Function
 */
export const generateFlashcards = async (text: string, mode: CardMode): Promise<FlashcardData[]> => {
  const { data, error } = await supabase.functions.invoke('generate-flashcards', {
    body: {
      action: 'generate',
      text,
      mode,
    },
  });

  if (error) {
    const errorMsg = await extractEdgeFunctionError(error, "Não foi possível gerar os flashcards.");
    console.error("Erro ao invocar generate-flashcards:", errorMsg);
    throw new Error(errorMsg);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const rawCards = data?.flashcards || [];
  const sources: WebSource[] = data?.sources || [];

  return rawCards.map((card: any) => ({
    ...card,
    id: crypto.randomUUID(),
    mode: mode,
    feedback: FeedbackStatus.Unseen,
    sources: sources.length > 0 ? sources : undefined,
  }));
};

/**
 * Cleans and normalizes text content
 * - Removes HTML tags
 * - Normalizes line breaks
 * - Removes extra whitespace
 */
export const cleanContent = (text: string): string => {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');

  // Normalize line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\r\n/g, '\n');

  // Remove extra whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n\s+/g, '\n');
  cleaned = cleaned.replace(/\s+\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

/**
 * Detects CSV separator (comma, semicolon, or tab)
 */
const detectCsvSeparator = (content: string): string => {
  const firstLine = content.split('\n')[0];

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > 0) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
};

/**
 * Parses .txt file into individual records
 * Splits by double line breaks or single line breaks
 */
export const parseTextFile = (content: string): string[] => {
  const cleaned = cleanContent(content);

  // Try splitting by double line breaks first (paragraph mode)
  let records = cleaned.split(/\n\n+/).filter(r => r.trim().length > 0);

  // If we get very few records, try single line breaks
  if (records.length < 3) {
    records = cleaned.split('\n').filter(r => r.trim().length > 0);
  }

  return records.map(r => cleanContent(r));
};

/**
 * Parses .csv file into individual records
 * Each row becomes a concatenated string of all columns
 */
export const parseCsvFile = (content: string): string[] => {
  const cleaned = cleanContent(content);
  const separator = detectCsvSeparator(cleaned);

  const lines = cleaned.split('\n').filter(line => line.trim().length > 0);

  return lines.map(line => {
    const columns = line.split(separator).map(col => col.trim());
    // Join columns with a clear separator for AI to parse
    return columns.join(' | ');
  });
};

/**
 * Main function to interpret and classify flashcards from file records via Supabase Edge Function
 */
export const interpretAndClassifyFlashcards = async (records: string[]): Promise<FlashcardData[]> => {
  const { data, error } = await supabase.functions.invoke('generate-flashcards', {
    body: {
      action: 'interpretRecords',
      records,
    },
  });

  if (error) {
    const errorMsg = await extractEdgeFunctionError(error, "Erro ao classificar registros.");
    console.error("Erro ao interpretar registros via Edge Function:", errorMsg);
    throw new Error(errorMsg);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const rawCards = data?.flashcards || [];

  return rawCards.map((parsed: any) => {
    const baseCard = {
      id: crypto.randomUUID(),
      feedback: FeedbackStatus.Unseen,
      sources: [],
    };

    switch (parsed.mode) {
      case CardMode.QA:
      default:
        return {
          ...baseCard,
          mode: CardMode.QA,
          question: parsed.question || '',
          answer: parsed.answer || '',
        } as any;

      case CardMode.TrueFalse:
        return {
          ...baseCard,
          mode: CardMode.TrueFalse,
          statement: parsed.statement || '',
          isTrue: parsed.isTrue === true,
          explanation: parsed.explanation || '',
        } as any;

      case CardMode.MultipleChoice:
        return {
          ...baseCard,
          mode: CardMode.MultipleChoice,
          question: parsed.question || '',
          options: parsed.options || [],
          correctAnswerIndex: parsed.correctAnswerIndex || 0,
          explanation: parsed.explanation || '',
        } as any;

      case CardMode.PracticalExample:
        return {
          ...baseCard,
          mode: CardMode.PracticalExample,
          problem: parsed.problem || '',
          question: parsed.question || '',
          solution: parsed.solution || '',
          sources: [],
        } as any;

      case CardMode.FillInTheBlank:
        return {
          ...baseCard,
          mode: CardMode.FillInTheBlank,
          question: parsed.sentence || '',
          answer: parsed.correctAnswer || '',
        } as any;

      case CardMode.Dictionary:
        return {
          ...baseCard,
          mode: CardMode.Dictionary,
          term: parsed.term || '',
          definition: parsed.definition || '',
        } as any;
    }
  });
};
