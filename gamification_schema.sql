-- Add streak tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_current INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_last_study_date DATE;

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon name
  condition_type TEXT NOT NULL, -- 'study_sessions', 'level', 'streak'
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Badges policies (Public read)
CREATE POLICY "Everyone can view badges" ON badges
  FOR SELECT USING (true);

-- User Badges table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS for user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- User Badges policies
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default badges
INSERT INTO badges (name, description, icon, condition_type, condition_value) VALUES
('Primeiro Passo', 'Completou a primeira sessão de estudos', '🏁', 'study_sessions', 1),
('Estudioso', 'Completou 10 sessões de estudos', '📚', 'study_sessions', 10),
('Dedicado', 'Completou 50 sessões de estudos', '🧠', 'study_sessions', 50),
('Mestre', 'Alcançou o nível 10', '👑', 'level', 10),
('Imparável', 'Manteve um streak de 7 dias', '🔥', 'streak', 7),
('Lendário', 'Manteve um streak de 30 dias', '⚡', 'streak', 30)
ON CONFLICT DO NOTHING;
