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
