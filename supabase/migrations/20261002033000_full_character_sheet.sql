-- RPG Barigui — garantia idempotente da estrutura da ficha completa
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS height text,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS appearance text,
  ADD COLUMN IF NOT EXISTS distinctive_marks text,
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS previous_occupation text,
  ADD COLUMN IF NOT EXISTS personality text,
  ADD COLUMN IF NOT EXISTS ideals text,
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS important_bond text,
  ADD COLUMN IF NOT EXISTS brief_history text,
  ADD COLUMN IF NOT EXISTS additional_characteristics text,
  ADD COLUMN IF NOT EXISTS specialization text,
  ADD COLUMN IF NOT EXISTS current_hp integer,
  ADD COLUMN IF NOT EXISTS current_mp integer;

ALTER TABLE characters ALTER COLUMN class_name DROP NOT NULL;
ALTER TABLE characters ALTER COLUMN class_name DROP DEFAULT;
UPDATE characters SET class_name = NULL WHERE class_name = 'Aprendiz';
