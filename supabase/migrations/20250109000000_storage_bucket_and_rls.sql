-- ==============================================================================
-- CONFIGURAÇÃO DO BUCKET DE STORAGE E POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- 1. Cria ou atualiza o bucket 'flashcard-images' com restrição de tipos MIME
--    permitidos (apenas JPEG, PNG, WebP e GIF) e limite de 5MB por arquivo.
-- 2. Define políticas de RLS na tabela storage.objects para isolar os arquivos
--    por usuário, impedindo que um usuário visualize caminhos privados, sobrescreva
--    ou exclua arquivos pertencentes a outros usuários.
-- ==============================================================================

-- 1. Criação / Configuração Segura do Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flashcard-images',
  'flashcard-images',
  true,
  5242880, -- 5 MB (em bytes)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Garantir que RLS esteja ativado em storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Política de Leitura Pública
-- Imagens associadas aos flashcards podem ser lidas publicamente para visualização no app
DROP POLICY IF EXISTS "Public flashcard images read access" ON storage.objects;
CREATE POLICY "Public flashcard images read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'flashcard-images');

-- 4. Política de Upload (INSERT)
-- Usuários autenticados só podem fazer upload se o primeiro segmento do caminho for o seu próprio auth.uid()
DROP POLICY IF EXISTS "Users can upload flashcard images to own folder" ON storage.objects;
CREATE POLICY "Users can upload flashcard images to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'flashcard-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Política de Atualização (UPDATE)
-- Usuários só podem atualizar arquivos situados na sua própria pasta
DROP POLICY IF EXISTS "Users can update own flashcard images" ON storage.objects;
CREATE POLICY "Users can update own flashcard images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'flashcard-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'flashcard-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Política de Exclusão (DELETE)
-- Usuários só podem excluir arquivos que estejam na sua própria pasta
DROP POLICY IF EXISTS "Users can delete own flashcard images" ON storage.objects;
CREATE POLICY "Users can delete own flashcard images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'flashcard-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
