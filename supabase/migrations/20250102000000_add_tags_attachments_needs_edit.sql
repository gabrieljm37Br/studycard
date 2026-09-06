-- Origin: add_tags_to_flashcards.sql
-- Add tags column to flashcards table
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for better performance when filtering by tags
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcards USING GIN (tags);

-- Add comment to document the column
COMMENT ON COLUMN flashcards.tags IS 'Array of tags for organizing and categorizing flashcards';


-- ==========================================

-- Origin: add_attachments_to_flashcards.sql
-- Add attachments column to flashcards table for image URLs
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

COMMENT ON COLUMN flashcards.attachments IS 'Array of image URLs attached to the flashcard';


-- ==========================================

-- Origin: add_needs_edit_to_flashcards.sql
-- Add needs_edit flag to flashcards to mark cards que precisam de ajustes/edição
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS needs_edit BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN flashcards.needs_edit IS 'Flag set by user to indicar que o card precisa de ajustes/edição.';
