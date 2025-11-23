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
