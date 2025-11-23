import { GoogleGenAI, Type } from "@google/genai";
import { CardMode, FeedbackStatus } from '../types';
import type { FlashcardData, WebSource } from '../types';

// The types from the API will be slightly different (no id or mode)
type ApiFlashcard = Omit<FlashcardData, 'id' | 'mode' | 'feedback' | 'sources'>;

const getPromptAndSchema = (mode: CardMode) => {
  switch (mode) {
    case CardMode.TrueFalse:
      return {
        prompt: `Com base nas informações do texto a seguir, gere entre 10 a 30 afirmações de verdadeiro ou falso. Cada item deve ter uma afirmação, um booleano indicando se é verdadeira e uma breve explicação didática.

IMPORTANTE: Gere NO MÍNIMO 10 flashcards e NO MÁXIMO 30 flashcards. Extraia os conceitos mais relevantes.

Texto:
"""
{text}
"""

Gere uma lista JSON com múltiplos flashcards.`,
        schema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              statement: { type: Type.STRING, description: "A afirmação a ser avaliada." },
              isTrue: { type: Type.BOOLEAN, description: "Verdadeiro se a afirmação estiver correta, falso caso contrário." },
              explanation: { type: Type.STRING, description: "Uma breve explicação do porquê a afirmação é verdadeira ou falsa." }
            },
            required: ["statement", "isTrue", "explanation"]
          }
        }
      };
    case CardMode.MultipleChoice:
      return {
        prompt: `Com base nas informações do texto a seguir, gere entre 10 a 30 perguntas de múltipla escolha. Cada pergunta deve ter um enunciado, uma lista de opções de resposta, o índice da resposta correta e uma breve explicação didática. Forneça 4 opções para cada pergunta.

IMPORTANTE: Gere NO MÍNIMO 10 flashcards e NO MÁXIMO 30 flashcards. Extraia os conceitos mais relevantes.

Texto:
"""
{text}
"""

Gere uma lista JSON com múltiplos flashcards.`,
        schema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "O enunciado da pergunta." },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de 4 opções de resposta." },
              correctAnswerIndex: { type: Type.INTEGER, description: "O índice (base 0) da resposta correta na lista de opções." },
              explanation: { type: Type.STRING, description: "Uma breve explicação da resposta correta." }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      };
    case CardMode.FillInTheBlank:
      return {
        prompt: `Com base nas informações do texto a seguir, gere entre 10 a 30 frases com lacunas (espaços em branco) para preenchimento.
Regras:
1. Use ____ (quatro sublinhados) para representar a lacuna.
2. A lacuna deve ser um conceito-chave, termo técnico, data ou nome próprio.
3. Não use lacunas para preposições simples.
4. Não use lacunas para números de normas e números de artigos de normas, pois não são relevantes para o conteúdo.
5. Cada frase deve ter apenas uma lacuna.
6. Forneça a resposta correta para a lacuna.
7. Preserve ao máximo a redação original do texto.

IMPORTANTE: Gere NO MÍNIMO 10 flashcards e NO MÁXIMO 30 flashcards.

Texto:
"""
{text}
"""

Gere uma lista JSON com múltiplos flashcards.`,
        schema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentence: { type: Type.STRING, description: "A frase com a lacuna (____)." },
              correctAnswer: { type: Type.STRING, description: "A palavra ou expressão que preenche a lacuna." }
            },
            required: ["sentence", "correctAnswer"]
          }
        }
      };
    case CardMode.QA:
    default:
      return {
        prompt: `Com base nas informações do texto a seguir, gere entre 10 a 30 flashcards de pergunta e resposta. Cada flashcard deve ter uma pergunta concisa e uma resposta clara. Extraia os conceitos, definições e fatos mais importantes.

IMPORTANTE: Gere NO MÍNIMO 10 flashcards e NO MÁXIMO 30 flashcards. Cubra os principais conceitos do texto.

Texto:
"""
{text}
"""

Gere uma lista JSON com múltiplos flashcards.`,
        schema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "A pergunta ou o termo no flashcard." },
              answer: { type: Type.STRING, description: "A resposta ou a definição no flashcard." }
            },
            required: ["question", "answer"]
          }
        }
      };
  }
};

/**
 * Extracts a JSON string from a larger text block, removing markdown fences and conversational text.
 * @param text The raw text from the API response.
 * @returns A string that is likely to be valid JSON.
 */
const extractJson = (text: string): string => {
  // Attempt to find a JSON block enclosed in markdown ```json ... ```
  const markdownJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownJsonMatch && markdownJsonMatch[1]) {
    return markdownJsonMatch[1].trim();
  }

  // If not found in markdown, look for the first occurrence of `[` and the last `]`
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');
  if (startIndex !== -1 && endIndex > startIndex) {
    return text.substring(startIndex, endIndex + 1).trim();
  }

  // As a last resort, return the original text. It might be valid JSON on its own or it will fail parsing.
  return text;
};


/**
 * Generates flashcards using web search for topic-based generation
 */
export const generateFlashcardsWithSearch = async (topic: string, mode: CardMode): Promise<FlashcardData[]> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não está definida.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const { prompt: promptTemplate, schema } = getPromptAndSchema(mode);

    // Create a search-enhanced prompt
    const searchPrompt = `Pesquise na web sobre o tópico: "${topic}"

Use as informações encontradas na pesquisa para criar flashcards educativos e didáticos de alta qualidade.

${promptTemplate.replace('{text}', `informações sobre ${topic} que você encontrou na pesquisa`)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources: WebSource[] = groundingChunks
      .map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string; } => !!web && !!web.uri && !!web.title);

    const jsonString = response.text.trim();
    const parsedFlashcards: ApiFlashcard[] = JSON.parse(jsonString);

    if (!Array.isArray(parsedFlashcards)) {
      throw new Error("A resposta da API não é um array válido.");
    }

    return parsedFlashcards.map((card) => {
      if (mode === CardMode.FillInTheBlank) {
        return {
          ...(card as any),
          id: crypto.randomUUID(),
          mode: mode,
          feedback: FeedbackStatus.Unseen,
          sources: sources,
          question: (card as any).sentence,
          answer: (card as any).correctAnswer,
        };
      }
      return {
        ...(card as any),
        id: crypto.randomUUID(),
        mode: mode,
        feedback: FeedbackStatus.Unseen,
        sources: sources,
      };
    });

  } catch (error) {
    console.error("Erro ao gerar flashcards com pesquisa:", error);
    if (error instanceof SyntaxError) {
      throw new Error("A resposta da IA não estava no formato JSON esperado. Isso pode acontecer ocasionalmente. Por favor, tente gerar os flashcards novamente.");
    }
    throw new Error("Não foi possível gerar os flashcards. Verifique o tópico fornecido e tente novamente.");
  }
};


export const generateFlashcards = async (text: string, mode: CardMode): Promise<FlashcardData[]> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não está definida.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    if (mode === CardMode.PracticalExample) {
      const prompt = `Analise o texto a seguir e use a pesquisa na web para encontrar aplicações práticas. Com base nisso, crie um conjunto de flashcards de 'exemplo prático' em três fases.
Cada flashcard deve conter:
1.  "problem": uma situação-problema ou um cenário do mundo real que requeira a aplicação prática das informações.
2.  "question": uma pergunta direta sobre como resolver ou abordar a situação-problema apresentada.
3.  "solution": a solução detalhada para o problema, respondendo diretamente à pergunta formulada.

Texto:
"""
${text}
"""

Responda APENAS com o array JSON de flashcards. Não inclua nenhum texto introdutório, formatação markdown ou explicações adicionais.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources: WebSource[] = groundingChunks
        .map(chunk => chunk.web)
        .filter((web): web is { uri: string; title: string; } => !!web && !!web.uri && !!web.title);

      const rawText = response.text.trim();
      const jsonString = extractJson(rawText);
      const parsedFlashcards: Omit<ApiFlashcard, 'deckId'>[] = JSON.parse(jsonString);

      if (!Array.isArray(parsedFlashcards)) {
        throw new Error("A resposta da API não é um array válido.");
      }

      return parsedFlashcards.map((card) => ({
        ...(card as any),
        id: crypto.randomUUID(),
        mode: mode,
        feedback: FeedbackStatus.Unseen,
        sources: sources,
      }));

    } else {
      // Handle other modes with response schema
      const { prompt: promptTemplate, schema } = getPromptAndSchema(mode);
      const prompt = promptTemplate.replace('{text}', text);

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const jsonString = response.text.trim();
      const parsedFlashcards: ApiFlashcard[] = JSON.parse(jsonString);

      if (!Array.isArray(parsedFlashcards)) {
        throw new Error("A resposta da API não é um array válido.");
      }

      return parsedFlashcards.map((card) => ({
        ...(card as any),
        id: crypto.randomUUID(),
        mode: mode,
        feedback: FeedbackStatus.Unseen,
      }));
    }
  } catch (error) {
    console.error("Erro ao gerar flashcards:", error);
    if (error instanceof SyntaxError) {
      throw new Error("A resposta da IA não estava no formato JSON esperado. Isso pode acontecer ocasionalmente. Por favor, tente gerar os flashcards novamente.");
    }
    throw new Error("Não foi possível gerar os flashcards. Verifique o texto fornecido e o modo selecionado, e tente novamente.");
  }
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
 * Interprets a single record and classifies it into the appropriate flashcard mode
 */
const interpretRecord = async (record: string, ai: any): Promise<FlashcardData | null> => {
  try {
    const prompt = `Analise o seguinte registro e classifique-o em UMA das modalidades de flashcard.

MODALIDADES DISPONÍVEIS:

1. **qa** (Pergunta e Resposta)
   - Pergunta direta seguida de resposta textual
   - Exemplo: "O que é fotossíntese? | Processo de conversão de luz em energia"

2. **true_false** (Verdadeiro ou Falso)
   - Afirmação que pode ser julgada como verdadeira ou falsa
   - Pode conter: "Certo/Errado", "V/F", "Verdadeiro/Falso"
   - Exemplo: "A Terra é plana | Falso"

3. **multiple_choice** (Múltipla Escolha)
   - Pergunta com alternativas A, B, C, D
   - Gabarito indicando alternativa correta
   - Exemplo: "Maior planeta? | A) Marte | B) Júpiter | C) Saturno | D) Netuno | Gabarito: B"

4. **practical_example** (Exemplo Prático)
   - Caso concreto, cenário descritivo
   - Situação do mundo real seguida de pergunta analítica
   - Exemplo: "João comprou um carro usado... | Como ele deve proceder?"

5. **fill_in_the_blank** (Lacunas)
   - Texto com espaços em branco: ____, (   ), [   ]
   - Exemplo: "A ____ é o processo de evaporação | água"

REGISTRO A ANALISAR:
"""
${record}
"""

INSTRUÇÕES:
1. Identifique a modalidade mais apropriada
2. Extraia e estruture os dados conforme o formato da modalidade
3. Limpe o conteúdo (remova formatação desnecessária)
4. Retorne APENAS o JSON estruturado, sem texto adicional

FORMATOS DE RETORNO:

Para qa:
{
  "mode": "qa",
  "question": "pergunta aqui",
  "answer": "resposta aqui"
}

Para true_false:
{
  "mode": "true_false",
  "statement": "afirmação aqui",
  "isTrue": true ou false,
  "explanation": "explicação breve"
}

Para multiple_choice:
{
  "mode": "multiple_choice",
  "question": "pergunta aqui",
  "options": ["opção A", "opção B", "opção C", "opção D"],
  "correctAnswerIndex": 0-3,
  "explanation": "explicação da resposta"
}

Para practical_example:
{
  "mode": "practical_example",
  "problem": "descrição do caso/cenário",
  "question": "pergunta sobre o caso",
  "solution": "solução/resposta"
}

Para fill_in_the_blank:
{
  "mode": "fill_in_the_blank",
  "sentence": "frase com ____",
  "correctAnswer": "palavra que preenche a lacuna"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    // Validate and transform to FlashcardData format
    const mode = parsed.mode as CardMode;

    if (!mode || !Object.values(CardMode).includes(mode)) {
      console.warn('Invalid mode returned by AI:', parsed.mode);
      return null;
    }

    // Create flashcard based on mode
    const baseCard = {
      id: crypto.randomUUID(),
      mode: mode,
      feedback: FeedbackStatus.Unseen,
    };

    switch (mode) {
      case CardMode.QA:
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

      default:
        return null;
    }

  } catch (error) {
    console.error('Error interpreting record:', error);
    return null;
  }
};

/**
 * Main function to interpret and classify flashcards from file records
 */
export const interpretAndClassifyFlashcards = async (records: string[]): Promise<FlashcardData[]> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não está definida.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const flashcards: FlashcardData[] = [];

  // Process records in batches to avoid rate limits
  for (const record of records) {
    if (!record.trim()) continue;

    const flashcard = await interpretRecord(record, ai);
    if (flashcard) {
      flashcards.push(flashcard);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return flashcards;
};