-- ==============================================================================
-- CORREÇÃO DE SEGURANÇA: SEC-01 (BOLA / IDOR) E SEC-07 (SEARCH_PATH HIJACKING)
-- ==============================================================================
-- 1. Garante que nenhuma função RPC com SECURITY DEFINER permita a consulta ou
--    modificação de dados pertencentes a outros usuários (Prevenção de BOLA/IDOR).
-- 2. Restringe a busca de objetos definindo explicitamente "SET search_path = public, pg_temp;"
--    evitando ataques de sequestro de caminho de busca (Search Path Hijacking).
-- ==============================================================================

-- ==============================================================================
-- 1. FUNÇÕES DE ESTATÍSTICAS (Prevenção de BOLA / IDOR em get_study_heatmap)
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_study_heatmap(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(date TEXT, count BIGINT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Garantir que a requisição seja de um usuário autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  -- Bloqueio de BOLA/IDOR: não permite consultar dados de outros usuários
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

-- ==============================================================================
-- 2. MATURIDADE DOS CARDS (Prevenção de BOLA / IDOR em get_card_maturity)
-- ==============================================================================
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

-- ==============================================================================
-- 3. PREVISÃO DE REVISÕES (Prevenção de BOLA / IDOR em get_review_forecast)
-- ==============================================================================
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

-- ==============================================================================
-- 4. DECKS COM MENOR RETENÇÃO (Prevenção de BOLA / IDOR em get_weakest_decks)
-- ==============================================================================
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
  HAVING COUNT(*) >= 5
  ORDER BY accuracy ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 5. SINCRONIZAÇÃO DE MEDALHAS (Prevenção de BOLA / IDOR em sync_user_badges)
-- ==============================================================================
CREATE OR REPLACE FUNCTION sync_user_badges(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  icon TEXT,
  condition_type TEXT,
  condition_value INTEGER,
  is_new BOOLEAN
) AS $$
DECLARE
  v_total_studied INTEGER;
  v_user_level INTEGER;
  v_user_streak INTEGER;
  v_badge RECORD;
  v_is_new BOOLEAN;
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: Não é permitido sincronizar medalhas de outro usuário.';
  END IF;

  SELECT COUNT(*) INTO v_total_studied FROM study_sessions WHERE user_id = v_user_id;
  SELECT level, streak_current INTO v_user_level, v_user_streak FROM profiles WHERE id = v_user_id;

  FOR v_badge IN SELECT * FROM badges LOOP
    v_is_new := false;
    IF NOT EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = v_user_id AND ub.badge_id = v_badge.id) THEN
      IF (v_badge.condition_type = 'study_sessions' AND v_total_studied >= v_badge.condition_value)
         OR (v_badge.condition_type = 'level' AND COALESCE(v_user_level, 1) >= v_badge.condition_value)
         OR (v_badge.condition_type = 'streak' AND COALESCE(v_user_streak, 0) >= v_badge.condition_value) THEN
        INSERT INTO user_badges (user_id, badge_id, awarded_at)
        VALUES (v_user_id, v_badge.id, NOW())
        ON CONFLICT (user_id, badge_id) DO NOTHING;
        v_is_new := true;
      END IF;
    END IF;

    IF v_is_new THEN
      id := v_badge.id;
      name := v_badge.name;
      description := v_badge.description;
      icon := v_badge.icon;
      condition_type := v_badge.condition_type;
      condition_value := v_badge.condition_value;
      is_new := true;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 6. ESTATÍSTICAS DO DIA (Prevenção de BOLA / IDOR em get_today_stats)
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_today_stats(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  studied_today BIGINT,
  correct_today BIGINT,
  xp_today BIGINT
) AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
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
    COUNT(*)::BIGINT AS studied_today,
    COUNT(CASE WHEN result = 'correct' THEN 1 END)::BIGINT AS correct_today,
    COALESCE(SUM(xp_earned), 0)::BIGINT AS xp_today
  FROM study_sessions
  WHERE user_id = v_user_id
    AND DATE(created_at) = v_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 7. BUSCA DE DECKS (Prevenção de BOLA / IDOR em search_decks)
-- ==============================================================================
CREATE OR REPLACE FUNCTION search_decks(p_query TEXT, p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  name TEXT,
  path TEXT,
  flashcards_count BIGINT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: Não é permitido buscar decks de outro usuário.';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.name AS path,
    COUNT(f.id)::BIGINT AS flashcards_count
  FROM decks d
  LEFT JOIN flashcards f ON f.deck_id = d.id
  WHERE d.user_id = v_user_id
    AND d.name ILIKE '%' || p_query || '%'
  GROUP BY d.id, d.name
  ORDER BY d.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 8. MÉTRICAS RECURSIVAS DE DECK (Prevenção de BOLA / IDOR em get_deck_recursive_metrics)
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_deck_recursive_metrics(p_deck_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_deck_owner UUID;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  -- Validar se o deck existe e pertence ao usuário autenticado
  SELECT user_id INTO v_deck_owner FROM decks WHERE id = p_deck_id;
  IF v_deck_owner IS NULL OR v_deck_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: O deck informado não existe ou não pertence ao usuário.';
  END IF;

  WITH RECURSIVE deck_tree AS (
    SELECT id FROM decks WHERE id = p_deck_id AND user_id = auth.uid()
    UNION ALL
    SELECT d.id FROM decks d
    INNER JOIN deck_tree dt ON d.parent_id = dt.id
    WHERE d.user_id = auth.uid()
  ),
  relevant_cards AS (
    SELECT id, feedback FROM flashcards 
    WHERE deck_id IN (SELECT id FROM deck_tree)
      AND user_id = auth.uid()
  ),
  card_counts AS (
    SELECT 
      COUNT(*)::INTEGER AS total_cards,
      COUNT(CASE WHEN feedback = 'unseen' OR feedback IS NULL THEN 1 END)::INTEGER AS unseen,
      COUNT(CASE WHEN feedback = 'incorrect' THEN 1 END)::INTEGER AS learning,
      COUNT(CASE WHEN feedback = 'almost' THEN 1 END)::INTEGER AS almost,
      COUNT(CASE WHEN feedback = 'correct' THEN 1 END)::INTEGER AS reviewing
    FROM relevant_cards
  ),
  relevant_sessions AS (
    SELECT ss.created_at, ss.result 
    FROM study_sessions ss
    WHERE ss.flashcard_id IN (SELECT id FROM relevant_cards)
      AND ss.user_id = auth.uid()
  ),
  history_agg AS (
    SELECT 
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'date', TO_CHAR(DATE(created_at), 'YYYY-MM-DD'),
            'count', day_total,
            'correct_count', day_correct
          )
        ),
        '[]'::jsonb
      ) AS history
    FROM (
      SELECT 
        DATE(created_at) AS created_at,
        COUNT(*)::INTEGER AS day_total,
        COUNT(CASE WHEN result = 'correct' THEN 1 END)::INTEGER AS day_correct
      FROM relevant_sessions
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    ) sub
  ),
  session_totals AS (
    SELECT 
      COUNT(*)::INTEGER AS total_reviews,
      COUNT(CASE WHEN result = 'correct' THEN 1 END)::INTEGER AS total_correct
    FROM relevant_sessions
  )
  SELECT jsonb_build_object(
    'total_cards', cc.total_cards,
    'counts', jsonb_build_object(
      'unseen', cc.unseen,
      'learning', cc.learning,
      'reviewing', cc.reviewing,
      'almost', cc.almost
    ),
    'study_history', ha.history,
    'total_reviews', st.total_reviews,
    'total_correct', st.total_correct
  )
  INTO v_result
  FROM card_counts cc, history_agg ha, session_totals st;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 9. HARDENING DE TRIGGER FUNCTIONS (Proteção contra Search Path Hijacking)
-- ==============================================================================
CREATE OR REPLACE FUNCTION protect_profile_gamification_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.streak_current := OLD.streak_current;
    NEW.streak_last_study_date := OLD.streak_last_study_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION on_study_session_inserted()
RETURNS TRIGGER AS $$
DECLARE
  v_xp INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_today DATE := CURRENT_DATE;
  v_last_study DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_total_studied INTEGER;
  v_badge RECORD;
BEGIN
  v_xp := COALESCE(NEW.xp_earned, 0);
  IF v_xp > 10 THEN
    v_xp := 10;
  ELSIF v_xp < 0 THEN
    v_xp := 0;
  END IF;

  SELECT xp, level, streak_current, streak_last_study_date
  INTO v_new_xp, v_new_level, v_current_streak, v_last_study
  FROM profiles
  WHERE id = NEW.user_id;

  v_new_xp := COALESCE(v_new_xp, 0) + v_xp;
  v_new_level := FLOOR(v_new_xp / 100) + 1;

  v_current_streak := COALESCE(v_current_streak, 0);
  IF v_last_study IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_study = v_today THEN
    v_new_streak := v_current_streak;
  ELSIF v_last_study = (v_today - INTERVAL '1 day')::DATE THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE profiles
  SET xp = v_new_xp,
      level = v_new_level,
      streak_current = v_new_streak,
      streak_last_study_date = v_today,
      updated_at = NOW()
  WHERE id = NEW.user_id;

  SELECT COUNT(*) INTO v_total_studied
  FROM study_sessions
  WHERE user_id = NEW.user_id;

  FOR v_badge IN
    SELECT b.id, b.condition_type, b.condition_value
    FROM badges b
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = NEW.user_id AND ub.badge_id = b.id
    )
  LOOP
    IF (v_badge.condition_type = 'study_sessions' AND v_total_studied >= v_badge.condition_value)
       OR (v_badge.condition_type = 'level' AND v_new_level >= v_badge.condition_value)
       OR (v_badge.condition_type = 'streak' AND v_new_streak >= v_badge.condition_value) THEN
      INSERT INTO user_badges (user_id, badge_id, awarded_at)
      VALUES (NEW.user_id, v_badge.id, NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
