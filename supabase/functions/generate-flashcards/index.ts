import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Limites estritos de segurança para prevenção de DoS e exaustão de custos (Denial of Wallet)
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_TEXT_LENGTH = 50000; // ~10.000 palavras
const MAX_TOPIC_LENGTH = 300;
const MAX_RECORDS = 50; // Máximo de 50 registros por lote no interpretador
const MAX_RECORD_LENGTH = 3000;
const VALID_MODES = new Set(['qa', 'true_false', 'multiple_choice', 'practical_example', 'fill_in_the_blank', 'dictionary']);

interface WebSource {
  uri: string;
  title: string;
}

const extractJson = (text: string): string => {
  const markdownJsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownJsonMatch && markdownJsonMatch[1]) {
    return markdownJsonMatch[1].trim();
  }
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');
  if (startIndex !== -1 && endIndex > startIndex) {
    return text.substring(startIndex, endIndex + 1).trim();
  }
  const startObj = text.indexOf('{');
  const endObj = text.lastIndexOf('}');
  if (startObj !== -1 && endObj > startObj) {
    return text.substring(startObj, endObj + 1).trim();
  }
  return text.trim();
};

const getPromptAndSchema = (mode: string) => {
  switch (mode) {
    case 'true_false':
      return {
        prompt: `Com base nas informações do texto a seguir, gere entre 10 a 30 afirmações de verdadeiro ou falso. Cada item deve ter uma afirmação, um booleano indicando se é verdadeira e uma breve explicação didática.

IMPORTANTE: Gere NO MÍNIMO 10 flashcards e NO MÁXIMO 30 flashcards. Extraia os conceitos mais relevantes.

Texto:
"""
{text}
"""

Gere uma lista JSON com múltiplos flashcards.`,
        schema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              statement: { type: "STRING", description: "A afirmação a ser avaliada." },
              isTrue: { type: "BOOLEAN", description: "Verdadeiro se a afirmação estiver correta, falso caso contrário." },
              explanation: { type: "STRING", description: "Uma breve explicação do porquê a afirmação é verdadeira ou falsa." }
            },
            required: ["statement", "isTrue", "explanation"]
          }
        }
      };

    case 'multiple_choice':
      return {
        prompt: `Com base nas informações do texto a seguir, gere entre 10 a 30 perguntas de múltipla escolha. Cada pergunta deve ter um enunciado, uma lista de opções de resposta, o índice da resposta correta e uma breve explicação didática. Forneça 4 opções para cada pergunta.

IMPORTANTE: Gere NO MÍNIMO 10 flashcards e NO MÁXIMO 30 flashcards. Extraia os conceitos mais relevantes.

Texto:
"""
{text}
"""

Gere uma lista JSON com múltiplos flashcards.`,
        schema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING", description: "O enunciado da pergunta." },
              options: { type: "ARRAY", items: { type: "STRING" }, description: "Uma lista de 4 opções de resposta." },
              correctAnswerIndex: { type: "INTEGER", description: "O índice (base 0) da resposta correta na lista de opções." },
              explanation: { type: "STRING", description: "Uma breve explicação da resposta correta." }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      };

    case 'fill_in_the_blank':
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
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              sentence: { type: "STRING", description: "A frase com a lacuna (____)." },
              correctAnswer: { type: "STRING", description: "A palavra ou expressão que preenche a lacuna." }
            },
            required: ["sentence", "correctAnswer"]
          }
        }
      };

    case 'dictionary':
      return {
        prompt: `Gere entre 10 e 30 flashcards de Dicionário (termo e definição) com base no texto a seguir.
Cada item deve conter:
1. "term": termo ou conjunto de termos conceituais.
2. "definition": o conceito/definição clara e concisa.

IMPORTANTE: Gere NO MÍNIMO 10 e NO MÁXIMO 30 itens. Extraia os conceitos mais relevantes do texto.

Texto:
"""
{text}
"""

Responda com uma lista JSON contendo objetos com "term" e "definition".`,
        schema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              term: { type: "STRING", description: "O termo ou conjunto de termos." },
              definition: { type: "STRING", description: "A definição clara do termo." }
            },
            required: ["term", "definition"]
          }
        }
      };

    case 'qa':
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
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING", description: "A pergunta ou o termo no flashcard." },
              answer: { type: "STRING", description: "A resposta ou a definição no flashcard." }
            },
            required: ["question", "answer"]
          }
        }
      };
  }
};

async function callGemini(apiKey: string, payload: any, model = "gemini-3.5-flash-lite") {
  const modelsToTry = [model, "gemini-3.5-flash", "gemini-3.7-flash"];
  let lastError: Error | null = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Gemini API Warning with model ${m}: ${res.status} - ${errorText}`);
        lastError = new Error(`Erro na API do Gemini (${res.status}): ${errorText}`);
        continue;
      }

      return await res.json();
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Falha ao comunicar com a API do Gemini em todos os modelos tentados.');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método HTTP não permitido. Utilize POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Limite de tamanho de carga (Prevenção de DoS de memória)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Payload excede o limite máximo permitido de 2MB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Autenticação obrigatória com Supabase Auth (Prevenção de acesso anônimo não autorizado)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado: Cabeçalho Authorization ausente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Configuração ausente: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados no ambiente.');
      return new Response(
        JSON.stringify({ error: 'Configuração interna do servidor ausente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: Sessão de usuário inválida ou expirada. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verificação de chave de serviço da IA
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração ausente: GEMINI_API_KEY não foi definida nas Secrets do Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validação de formato JSON
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corpo da requisição JSON inválido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, text, topic, mode = 'qa', records } = body || {};
    const safeMode = VALID_MODES.has(mode) ? mode : 'qa';

    // --------------------------------------------------------------------------
    // Ação: Healthcheck Sintético (Smoke Test de Disponibilidade e Latência)
    // --------------------------------------------------------------------------
    if (action === 'healthcheck' || action === 'ping') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'generate-flashcards',
          timestamp: new Date().toISOString(),
          geminiConfigured: Boolean(apiKey),
          authenticatedUserId: user.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'test-model') {
      const modelToTest = body.testModel || 'gemini-2.5-flash-lite';
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }]
        })
      });
      const text = await testRes.text();
      return new Response(JSON.stringify({ status: testRes.status, response: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --------------------------------------------------------------------------
    // Ação: Gerar a partir de texto
    // --------------------------------------------------------------------------
    if (action === 'generate') {
      if (!text || typeof text !== 'string' || !text.trim()) {
        return new Response(
          JSON.stringify({ error: 'Parâmetro "text" é obrigatório e deve conter conteúdo textual válido.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (text.length > MAX_TEXT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Texto excede o limite máximo permitido de ${MAX_TEXT_LENGTH.toLocaleString()} caracteres.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (safeMode === 'practical_example') {
        const prompt = `Analise o texto a seguir e use a pesquisa na web para encontrar aplicações práticas. Com base nisso, crie um conjunto de flashcards de 'exemplo prático' em três fases.
Cada flashcard deve conter:
1. "problem": uma situação-problema ou um cenário do mundo real que requeira a aplicação prática das informações.
2. "question": uma pergunta direta sobre como resolver ou abordar a situação-problema apresentada.
3. "solution": a solução detalhada para o problema, respondendo diretamente à pergunta formulada.

Texto:
"""
${text}
"""

Responda APENAS com o array JSON de flashcards. Não inclua nenhum texto introdutório, formatação markdown ou explicações adicionais.`;

        const geminiRes = await callGemini(apiKey, {
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
        });

        const candidate = geminiRes.candidates?.[0];
        const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
        const sources: WebSource[] = groundingChunks
          .map((chunk: any) => chunk.web)
          .filter((web: any): web is WebSource => !!web && !!web.uri && !!web.title);

        const rawText = candidate?.content?.parts?.[0]?.text ?? '';
        const jsonStr = extractJson(rawText);
        const parsed = JSON.parse(jsonStr);

        return new Response(
          JSON.stringify({ flashcards: parsed, sources }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const { prompt: promptTemplate, schema } = getPromptAndSchema(safeMode);
        const prompt = promptTemplate.replace('{text}', text);

        const geminiRes = await callGemini(apiKey, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });

        const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
        const parsed = JSON.parse(rawText.trim());

        return new Response(
          JSON.stringify({ flashcards: parsed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // --------------------------------------------------------------------------
    // Ação: Gerar a partir de tópico com pesquisa na web
    // --------------------------------------------------------------------------
    if (action === 'generateWithSearch') {
      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        return new Response(
          JSON.stringify({ error: 'Parâmetro "topic" é obrigatório e deve conter uma string válida.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (topic.length > MAX_TOPIC_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Tópico excede o limite máximo permitido de ${MAX_TOPIC_LENGTH} caracteres.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { prompt: promptTemplate, schema } = getPromptAndSchema(safeMode);
      const searchPrompt = `Pesquise na web sobre o tópico: "${topic}"

Use as informações encontradas na pesquisa para criar flashcards educativos e didáticos de alta qualidade.

${promptTemplate.replace('{text}', `informações sobre ${topic} que você encontrou na pesquisa`)}`;

      const geminiRes = await callGemini(apiKey, {
        contents: [{ parts: [{ text: searchPrompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const candidate = geminiRes.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
      const sources: WebSource[] = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any): web is WebSource => !!web && !!web.uri && !!web.title);

      const rawText = candidate?.content?.parts?.[0]?.text ?? '[]';
      const parsed = JSON.parse(rawText.trim());

      return new Response(
        JSON.stringify({ flashcards: parsed, sources }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // Ação: Interpretar e classificar registros de arquivos (com contenção de custos)
    // --------------------------------------------------------------------------
    if (action === 'interpretRecords') {
      if (!Array.isArray(records) || records.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Array de "records" inválido ou vazio.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (records.length > MAX_RECORDS) {
        return new Response(
          JSON.stringify({ error: `Número de registros excede o limite de segurança (${MAX_RECORDS} por lote). Por favor, reduza a seleção.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const promptTemplate = `Você é um especialista em estruturação pedagógica de flashcards.
Sua tarefa é analisar o seguinte registro textual e estruturá-lo no formato JSON mais adequado.

REGISTRO A ANALISAR:
"""
{record}
"""

Retorne APENAS um objeto JSON no formato correspondente:
- qa: { "mode": "qa", "question": "...", "answer": "..." }
- true_false: { "mode": "true_false", "statement": "...", "isTrue": true|false, "explanation": "..." }
- multiple_choice: { "mode": "multiple_choice", "question": "...", "options": ["..."], "correctAnswerIndex": 0, "explanation": "..." }
- practical_example: { "mode": "practical_example", "problem": "...", "question": "...", "solution": "..." }
- fill_in_the_blank: { "mode": "fill_in_the_blank", "sentence": "frase com ____", "correctAnswer": "..." }
- dictionary: { "mode": "dictionary", "term": "...", "definition": "..." }`;

      const results = [];
      for (const rawRec of records) {
        if (!rawRec || typeof rawRec !== 'string') continue;
        const rec = rawRec.trim().slice(0, MAX_RECORD_LENGTH);
        if (!rec) continue;

        try {
          const prompt = promptTemplate.replace('{record}', rec);
          const geminiRes = await callGemini(apiKey, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          });
          const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const parsed = JSON.parse(extractJson(rawText));
          results.push(parsed);
        } catch (itemErr) {
          console.error('Erro ao interpretar registro individual:', itemErr);
        }
      }

      return new Response(
        JSON.stringify({ flashcards: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Ação solicitada "${action}" é desconhecida ou inválida.` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Edge function handler error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno no processamento da Edge Function.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
