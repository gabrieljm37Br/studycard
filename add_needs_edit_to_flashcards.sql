-- Add needs_edit flag to flashcards to mark cards que precisam de ajustes/edição
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS needs_edit BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN flashcards.needs_edit IS 'Flag set by user to indicar que o card precisa de ajustes/edição.';
