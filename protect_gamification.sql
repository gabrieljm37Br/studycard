-- ==============================================================================
-- PROTEÇÃO DE GAMIFICAÇÃO E REFORÇO DE RLS
-- ==============================================================================

-- 1. Revogar inserção direta na tabela user_badges pelo cliente
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;

-- Garantir que a política de leitura exista e seja restrita ao próprio usuário
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Proteger colunas sensíveis em profiles contra alteração arbitrária pelo cliente
CREATE OR REPLACE FUNCTION protect_profile_gamification_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o comando for executado por um usuário autenticado via API do cliente (PostgREST),
  -- bloqueia alterações manuais em xp, level, streak_current e streak_last_study_date.
  IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.streak_current := OLD.streak_current;
    NEW.streak_last_study_date := OLD.streak_last_study_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_gamification ON profiles;
CREATE TRIGGER trg_protect_profile_gamification
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_gamification_fields();

-- 3. Trigger atômica em study_sessions para atualizar XP, nível, streak e medalhas no servidor
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
  -- Validar e conter XP: máximo de 10 XP por sessão para evitar fraude
  v_xp := COALESCE(NEW.xp_earned, 0);
  IF v_xp > 10 THEN
    v_xp := 10;
  ELSIF v_xp < 0 THEN
    v_xp := 0;
  END IF;

  -- Obter valores atuais de perfil
  SELECT xp, level, streak_current, streak_last_study_date
  INTO v_new_xp, v_new_level, v_current_streak, v_last_study
  FROM profiles
  WHERE id = NEW.user_id;

  v_new_xp := COALESCE(v_new_xp, 0) + v_xp;
  v_new_level := FLOOR(v_new_xp / 100) + 1;

  -- Calcular streak utilizando a data real do servidor PostgreSQL
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

  -- Atualizar perfil atomicamente (executado como SECURITY DEFINER, sem ser bloqueado pela trg_protect)
  UPDATE profiles
  SET xp = v_new_xp,
      level = v_new_level,
      streak_current = v_new_streak,
      streak_last_study_date = v_today,
      updated_at = NOW()
  WHERE id = NEW.user_id;

  -- Contar sessões de estudo totais do usuário
  SELECT COUNT(*) INTO v_total_studied
  FROM study_sessions
  WHERE user_id = NEW.user_id;

  -- Verificar e atribuir medalhas que o usuário ainda não possui
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_study_session_gamification ON study_sessions;
CREATE TRIGGER trg_study_session_gamification
  AFTER INSERT ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION on_study_session_inserted();

-- 4. Função RPC para sincronizar e retornar medalhas recém-conquistadas para o frontend
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
BEGIN
  IF p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;

  SELECT COUNT(*) INTO v_total_studied FROM study_sessions WHERE user_id = p_user_id;
  SELECT level, streak_current INTO v_user_level, v_user_streak FROM profiles WHERE id = p_user_id;

  FOR v_badge IN SELECT * FROM badges LOOP
    v_is_new := false;
    IF NOT EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = p_user_id AND ub.badge_id = v_badge.id) THEN
      IF (v_badge.condition_type = 'study_sessions' AND v_total_studied >= v_badge.condition_value)
         OR (v_badge.condition_type = 'level' AND COALESCE(v_user_level, 1) >= v_badge.condition_value)
         OR (v_badge.condition_type = 'streak' AND COALESCE(v_user_streak, 0) >= v_badge.condition_value) THEN
        INSERT INTO user_badges (user_id, badge_id, awarded_at)
        VALUES (p_user_id, v_badge.id, NOW())
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
