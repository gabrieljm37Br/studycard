-- =====================================================
-- FUNÇÕES SQL PARA ESTATÍSTICAS DO STUDYCARD
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Database → SQL Editor → New Query → Cole e Execute
-- =====================================================

-- 1. HEATMAP DE ATIVIDADE (últimos 365 dias)
-- =====================================================
CREATE OR REPLACE FUNCTION get_study_heatmap(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(date TEXT, count BIGINT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: Não é permitido consultar dados de outro usuário.';
  END IF;

  RETURN QUERY
  SELECT 
    TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
    COUNT(*)::BIGINT AS count
  FROM study_sessions
  WHERE user_id = v_user_id
    AND created_at >= NOW() - INTERVAL '365 days'
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =====================================================
-- 2. MATURIDADE DOS CARDS
-- =====================================================
CREATE OR REPLACE FUNCTION get_card_maturity(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(status TEXT, count BIGINT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: Não é permitido consultar dados de outro usuário.';
  END IF;

  RETURN QUERY
  SELECT 
    CASE 
      WHEN interval = 0 THEN 'Novos'
      WHEN interval <= 1 THEN 'Aprendendo'
      WHEN interval <= 7 THEN 'Jovens'
      ELSE 'Maduros'
    END AS status,
    COUNT(*)::BIGINT AS count
  FROM flashcards
  WHERE user_id = v_user_id
  GROUP BY status
  ORDER BY 
    CASE status
      WHEN 'Novos' THEN 1
      WHEN 'Aprendendo' THEN 2
      WHEN 'Jovens' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =====================================================
-- 3. PREVISÃO DE REVISÕES (próximos 7 dias)
-- =====================================================
CREATE OR REPLACE FUNCTION get_review_forecast(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(date TEXT, count BIGINT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: Não é permitido consultar dados de outro usuário.';
  END IF;

  RETURN QUERY
  SELECT 
    TO_CHAR(DATE(next_review), 'YYYY-MM-DD') AS date,
    COUNT(*)::BIGINT AS count
  FROM flashcards
  WHERE user_id = v_user_id
    AND next_review IS NOT NULL
    AND next_review >= CURRENT_DATE
    AND next_review <= CURRENT_DATE + INTERVAL '7 days'
  GROUP BY DATE(next_review)
  ORDER BY DATE(next_review);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =====================================================
-- 4. DECKS MAIS FRACOS (menor taxa de acerto)
-- =====================================================
CREATE OR REPLACE FUNCTION get_weakest_decks(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  deck_id UUID,
  deck_name TEXT,
  accuracy NUMERIC,
  total BIGINT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: Não é permitido consultar dados de outro usuário.';
  END IF;

  RETURN QUERY
  SELECT 
    d.id AS deck_id,
    d.name AS deck_name,
    ROUND(
      (COUNT(CASE WHEN ss.result = 'correct' THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*), 0) * 100), 2
    ) AS accuracy,
    COUNT(*)::BIGINT AS total
  FROM decks d
  INNER JOIN flashcards f ON f.deck_id = d.id
  INNER JOIN study_sessions ss ON ss.flashcard_id = f.id
  WHERE d.user_id = v_user_id
  GROUP BY d.id, d.name
  HAVING COUNT(*) >= 5  -- Mínimo de 5 estudos para aparecer
  ORDER BY accuracy ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =====================================================
-- NOTAS DE SEGURANÇA:
-- =====================================================
-- 1. As funções usam SECURITY DEFINER com "SET search_path = public, pg_temp;"
--    para evitar sequestro de search_path.
-- 2. As funções validam auth.uid() e impedem explicitamente que um usuário
--    consulte os dados de outro (mitigação de BOLA / IDOR).
