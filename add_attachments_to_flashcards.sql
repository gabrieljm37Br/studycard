-- Add attachments column to flashcards table for image URLs
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

COMMENT ON COLUMN flashcards.attachments IS 'Array of image URLs attached to the flashcard';
