-- Add tags column to flashcards table
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for better performance when filtering by tags
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcards USING GIN (tags);

-- Add comment to document the column
COMMENT ON COLUMN flashcards.tags IS 'Array of tags for organizing and categorizing flashcards';
