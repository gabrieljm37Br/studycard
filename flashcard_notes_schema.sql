-- Tabela para armazenar anotações de flashcards
CREATE TABLE IF NOT EXISTS flashcard_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
  note_text TEXT NOT NULL CHECK (char_length(note_text) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, flashcard_id)
);

-- Enable RLS
ALTER TABLE flashcard_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para flashcard_notes
CREATE POLICY "Users can view own notes" ON flashcard_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON flashcard_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON flashcard_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON flashcard_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_flashcard_notes_updated_at BEFORE UPDATE ON flashcard_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índice para melhorar performance de queries
CREATE INDEX idx_flashcard_notes_user_flashcard ON flashcard_notes(user_id, flashcard_id);
