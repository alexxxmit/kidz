ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender_presentation varchar(24) NOT NULL DEFAULT 'NOT_SPECIFIED',
  ADD COLUMN IF NOT EXISTS hair_profile jsonb NOT NULL DEFAULT '{"length":"MEDIUM","color":"DARK_BROWN","openToColorAdvice":true}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_gender_presentation_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_gender_presentation_check
      CHECK (gender_presentation IN ('FEMININE', 'MASCULINE', 'NEUTRAL', 'NOT_SPECIFIED'));
  END IF;
END $$;
