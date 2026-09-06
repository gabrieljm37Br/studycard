#!/usr/bin/env node

/**
 * Synthetic Smoke Test & Availability Monitor for Supabase Gemini Edge Function
 * 
 * Executa testes sintéticos para validar:
 * 1. Perímetro de Segurança: Rejeição com HTTP 401 de chamadas anônimas.
 * 2. Disponibilidade e Healthcheck: Validação de runtime, secrets e latência < SLA.
 * 3. Inferência de IA (opcional com --full): Validação de resposta real do Gemini.
 */

import { performance } from 'perf_hooks';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ixpkbgmrqftmokdyydsl.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGtiZ21ycWZ0bW9rZHl5ZHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzY0NzcsImV4cCI6MjA3OTIxMjQ3N30._F-tbXOz8bliVMCIpvXYvugUjzBYVc6QoUe84TM-5nk';

const FUNCTION_NAME = process.env.FUNCTION_NAME || 'generate-flashcards';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;

const SLA_HEALTHCHECK_MS = parseInt(process.env.SLA_HEALTHCHECK_MS || '3000', 10);
const SLA_INFERENCE_MS = parseInt(process.env.SLA_INFERENCE_MS || '12000', 10);

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'synthetic-monitor@studycard.app';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'SyntheticMonitorPass2026!';

const isFullInference = process.argv.includes('--full') || process.env.TEST_FULL_INFERENCE === 'true';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function getAuthenticatedUserToken() {
  // 1. Tentar Login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (!signInError && signInData?.session?.access_token) {
    return signInData.session.access_token;
  }

  // 2. Se não existir, criar usuário de teste sintético
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signUpError) {
    throw new Error(`Falha ao autenticar usuário sintético: ${signInError?.message || signUpError.message}`);
  }

  if (!signUpData?.session?.access_token) {
    throw new Error('Usuário sintético criado, mas confirmação de email pendente ou token ausente.');
  }

  return signUpData.session.access_token;
}

async function runSmokeTests() {
  console.log('\n========================================================================');
  console.log('🧪 INICIANDO TESTES SINTÉTICOS: Supabase Edge Function (Gemini)');
  console.log(`📡 URL Alvo: ${FUNCTION_URL}`);
  console.log(`⏱️ SLA Healthcheck: ${SLA_HEALTHCHECK_MS}ms | SLA Inferência: ${SLA_INFERENCE_MS}ms`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log('========================================================================\n');

  const results = [];
  let hasFailure = false;

  // --------------------------------------------------------------------------
  // TESTE 1: Perímetro de Segurança (Sem Auth -> 401 esperado)
  // --------------------------------------------------------------------------
  try {
    const t0 = performance.now();
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'healthcheck' }),
    });
    const latency = Math.round(performance.now() - t0);

    const isSuccess = res.status === 401;
    if (!isSuccess) hasFailure = true;

    results.push({
      test: '1. Perímetro de Segurança (Anônimo Bloqueado)',
      expectedStatus: 'HTTP 401',
      actualStatus: `HTTP ${res.status}`,
      latency: `${latency}ms`,
      sla: `< ${SLA_HEALTHCHECK_MS}ms`,
      passed: isSuccess,
    });
  } catch (err) {
    hasFailure = true;
    results.push({
      test: '1. Perímetro de Segurança (Anônimo Bloqueado)',
      expectedStatus: 'HTTP 401',
      actualStatus: 'Falha de Conexão',
      latency: 'N/A',
      sla: `< ${SLA_HEALTHCHECK_MS}ms`,
      passed: false,
      error: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Autenticação para testes autorizados
  // --------------------------------------------------------------------------
  let authToken = null;
  try {
    const tAuth0 = performance.now();
    authToken = await getAuthenticatedUserToken();
    const authLatency = Math.round(performance.now() - tAuth0);
    console.log(`🔑 Sessão JWT autenticada com sucesso (${authLatency}ms) para ${TEST_EMAIL}`);
  } catch (authErr) {
    console.error(`❌ Erro na autenticação do monitor sintético: ${authErr.message}`);
  }

  // --------------------------------------------------------------------------
  // TESTE 2: Healthcheck Sintético & Uptime (Autenticado -> 200 OK)
  // --------------------------------------------------------------------------
  if (authToken) {
    try {
      const t0 = performance.now();
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: 'healthcheck' }),
      });
      const latency = Math.round(performance.now() - t0);
      const data = await res.json().catch(() => ({}));

      const isStatus200 = res.status === 200;
      const isHealthOk = data.status === 'ok';
      const isGeminiReady = data.geminiConfigured === true;
      const isWithinSla = latency <= SLA_HEALTHCHECK_MS;
      const passed = isStatus200 && isHealthOk && isGeminiReady && isWithinSla;

      if (!passed) hasFailure = true;

      results.push({
        test: '2. Healthcheck Sintético & Uptime',
        expectedStatus: 'HTTP 200 (status: ok)',
        actualStatus: `HTTP ${res.status} (geminiConfigured: ${data.geminiConfigured})`,
        latency: `${latency}ms`,
        sla: `< ${SLA_HEALTHCHECK_MS}ms`,
        passed,
      });
    } catch (err) {
      hasFailure = true;
      results.push({
        test: '2. Healthcheck Sintético & Uptime',
        expectedStatus: 'HTTP 200',
        actualStatus: 'Falha de Conexão',
        latency: 'N/A',
        sla: `< ${SLA_HEALTHCHECK_MS}ms`,
        passed: false,
        error: err.message,
      });
    }
  } else {
    hasFailure = true;
    results.push({
      test: '2. Healthcheck Sintético & Uptime',
      expectedStatus: 'HTTP 200',
      actualStatus: 'Bloqueado (Auth Indisponível)',
      latency: 'N/A',
      sla: `< ${SLA_HEALTHCHECK_MS}ms`,
      passed: false,
    });
  }

  // --------------------------------------------------------------------------
  // TESTE 3: Inferência Real Gemini (opcional com --full)
  // --------------------------------------------------------------------------
  if (isFullInference && authToken) {
    try {
      console.log('🤖 Executando teste de inferência real com Gemini 3.5 Flash-Lite (Produção)...');
      const t0 = performance.now();
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'generate',
          text: 'A mitocôndria é responsável pela geração de energia na forma de ATP.',
          mode: 'true_false',
        }),
      });
      const latency = Math.round(performance.now() - t0);
      const data = await res.json().catch(() => ({}));

      const isStatus200 = res.status === 200;
      const hasCards = Array.isArray(data.flashcards) && data.flashcards.length > 0;
      const isWithinSla = latency <= SLA_INFERENCE_MS;
      const passed = isStatus200 && hasCards && isWithinSla;

      if (!passed) {
        hasFailure = true;
        console.error('Detalhe do erro na inferência:', JSON.stringify(data));
      }

      results.push({
        test: '3. Inferência Real do Modelo (End-to-End)',
        expectedStatus: 'HTTP 200 (flashcards > 0)',
        actualStatus: `HTTP ${res.status} (${data.flashcards?.length || 0} cards)`,
        latency: `${latency}ms`,
        sla: `< ${SLA_INFERENCE_MS}ms`,
        passed,
      });
    } catch (err) {
      hasFailure = true;
      results.push({
        test: '3. Inferência Real do Modelo (End-to-End)',
        expectedStatus: 'HTTP 200',
        actualStatus: 'Falha de Conexão',
        latency: 'N/A',
        sla: `< ${SLA_INFERENCE_MS}ms`,
        passed: false,
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Relatório Final
  // --------------------------------------------------------------------------
  console.log('\n📊 TABELA DE RESULTADOS DOS TESTES SINTÉTICOS:');
  console.table(
    results.map(r => ({
      Teste: r.test,
      Esperado: r.expectedStatus,
      Recebido: r.actualStatus,
      Latência: r.latency,
      SLA: r.sla,
      Resultado: r.passed ? '✅ PASS' : '❌ FAIL',
    }))
  );

  if (hasFailure) {
    console.error('\n❌ RESULTADO FINAL: Falha detectada em um ou mais testes sintéticos!');
    process.exit(1);
  } else {
    console.log('\n🏆 RESULTADO FINAL: Todos os testes sintéticos passaram dentro dos SLAs definidos!\n');
    process.exit(0);
  }
}

runSmokeTests().catch(err => {
  console.error('\n💥 Erro fatal ao executar smoke test:', err);
  process.exit(1);
});
