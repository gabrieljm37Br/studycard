ALTER TABLE flashcards DROP CONSTRAINT flashcards_mode_check;
ALTER TABLE flashcards ADD CONSTRAINT flashcards_mode_check CHECK (mode IN ('qa', 'true_false', 'multiple_choice', 'practical_example', 'fill_in_the_blank'));
