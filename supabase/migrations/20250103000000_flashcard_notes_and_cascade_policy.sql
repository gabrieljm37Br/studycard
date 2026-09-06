-- Origin: flashcard_notes_schema.sql
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


-- ==========================================

-- Origin: fix_delete_policy.sql
-- ============================================================================
-- FIX: Habilitar Exclusão de Decks e Flashcards
-- ============================================================================
-- Este script adiciona a política de segurança (RLS) que estava faltando
-- na tabela study_sessions, permitindo que o ON DELETE CASCADE funcione
-- corretamente ao excluir decks e flashcards.
--
-- PROBLEMA:
-- Quando você tenta excluir um deck ou flashcard, o banco de dados tenta
-- excluir automaticamente as sessões de estudo relacionadas (CASCADE).
-- Porém, sem a política de DELETE, o Supabase bloqueia a operação.
--
-- SOLUÇÃO:
-- Adicionar a política que permite aos usuários excluir suas próprias
-- sessões de estudo.
-- ============================================================================

-- Adiciona política de DELETE para study_sessions
CREATE POLICY "Users can delete own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- COMO USAR:
-- 1. Acesse: https://supabase.com/dashboard/project/ixpkbgmrqftmokdyydsl
-- 2. Clique em "SQL Editor" no menu lateral
-- 3. Clique em "New Query"
-- 4. Cole este script completo
-- 5. Clique em "Run" (ou pressione Ctrl+Enter)
-- 6. Aguarde a mensagem de sucesso ✅
-- 7. Teste excluindo um deck ou flashcard no aplicativo
-- ============================================================================

-- VERIFICAÇÃO (opcional):
-- Para verificar se a política foi criada corretamente, execute:
-- SELECT * FROM pg_policies WHERE tablename = 'study_sessions';
-- Você deve ver 3 políticas: SELECT, INSERT e DELETE


-- ==========================================

-- Origin: fix_flashcard_delete_policy.sql
-- Verificar e corrigir políticas RLS para flashcards
-- Este script garante que os usuários possam deletar seus próprios flashcards

-- Remover política existente se houver
DROP POLICY IF EXISTS "Users can delete own flashcards" ON flashcards;

-- Recriar política de DELETE para flashcards
CREATE POLICY "Users can delete own flashcards" ON flashcards
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Verificar se RLS está habilitado
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
