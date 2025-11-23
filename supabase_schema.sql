-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Decks table
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Decks policies
CREATE POLICY "Users can view own decks" ON decks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks" ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks" ON decks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks" ON decks
  FOR DELETE USING (auth.uid() = user_id);

-- Flashcards table
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('qa', 'true_false', 'multiple_choice', 'practical_example', 'fill_in_the_blank')),
  
  -- Common fields
  feedback TEXT DEFAULT 'unseen' CHECK (feedback IN ('unseen', 'incorrect', 'almost', 'correct')),
  
  -- Q&A fields
  question TEXT,
  answer TEXT,
  
  -- True/False fields
  statement TEXT,
  is_true BOOLEAN,
  explanation TEXT,
  
  -- Multiple Choice fields
  options JSONB,
  correct_answer_index INTEGER,
  
  -- Practical Example fields
  problem TEXT,
  solution TEXT,
  
  -- Sources
  sources JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Flashcards policies
CREATE POLICY "Users can view own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Study sessions table (for tracking performance and gamification)
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('incorrect', 'almost', 'correct')),
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Study sessions policies
CREATE POLICY "Users can view own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
