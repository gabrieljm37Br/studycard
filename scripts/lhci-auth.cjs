/**
 * Lighthouse CI Puppeteer Authentication Script
 * Injeta sessão de autenticação do Supabase no localStorage antes da auditoria
 * das rotas protegidas com code splitting.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ixpkbgmrqftmokdyydsl.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGtiZ21ycWZ0bW9rZHl5ZHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzY0NzcsImV4cCI6MjA3OTIxMjQ3N30._F-tbXOz8bliVMCIpvXYvugUjzBYVc6QoUe84TM-5nk';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'synthetic-monitor@studycard.app';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'SyntheticMonitorPass2026!';

let cachedSession = null;

async function getAuthSession() {
  if (cachedSession) return cachedSession;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (!error && data?.session) {
      cachedSession = data.session;
      return cachedSession;
    }
  } catch (err) {
    console.warn('Lighthouse CI: Falha ao obter sessão online via Supabase, utilizando mock.', err.message);
  }

  // Sessão mock de contingência para testes offline
  cachedSession = {
    access_token: 'mock-lhci-access-token',
    refresh_token: 'mock-lhci-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'synthetic-monitor-user-id',
      email: TEST_EMAIL,
      user_metadata: { full_name: 'Synthetic Monitor' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };
  return cachedSession;
}

/**
 * @param {import('puppeteer').Browser} browser
 * @param {{url: string}} context
 */
module.exports = async (browser, context) => {
  const urlObj = new URL(context.url);
  const origin = urlObj.origin;

  // Rota pública de login: limpa qualquer sessão residual para medição limpa
  if (context.url.includes('/login')) {
    const page = await browser.newPage();
    try {
      await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.evaluate(() => localStorage.clear());
    } catch (e) {
      // ignorar se timeout
    } finally {
      await page.close();
    }
    return;
  }

  const session = await getAuthSession();
  const page = await browser.newPage();

  try {
    // Navega para a origem na rota de login para obter o contexto do domínio no localStorage
    await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate((sess) => {
      localStorage.setItem('sb-ixpkbgmrqftmokdyydsl-auth-token', JSON.stringify(sess));
    }, session);
  } catch (err) {
    console.warn(`Aviso de injeção de autenticação para ${context.url}:`, err.message);
  } finally {
    await page.close();
  }
};
