CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  display_name varchar(40) NOT NULL,
  locale varchar(5) NOT NULL CHECK (locale IN ('ru', 'en')),
  age_years integer NOT NULL CHECK (age_years BETWEEN 0 AND 18),
  autonomy_mode varchar(24) NOT NULL CHECK (autonomy_mode IN ('PARENT_DECIDES', 'TOGETHER', 'USER_DECIDES')),
  gender_presentation varchar(24) NOT NULL DEFAULT 'NOT_SPECIFIED' CHECK (gender_presentation IN ('FEMININE', 'MASCULINE', 'NEUTRAL', 'NOT_SPECIFIED')),
  hair_profile jsonb NOT NULL DEFAULT '{"length":"MEDIUM","color":"DARK_BROWN","openToColorAdvice":true}'::jsonb,
  style_mix jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wardrobe_items (
  id uuid PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  category varchar(32) NOT NULL,
  slot varchar(24) NOT NULL,
  colors jsonb NOT NULL,
  warmth integer NOT NULL CHECK (warmth BETWEEN 0 AND 4),
  style_ids jsonb NOT NULL,
  care_state varchar(24) NOT NULL CHECK (care_state IN ('CLEAN', 'WORN_REUSABLE', 'LAUNDRY')),
  fit_state varchar(24) NOT NULL CHECK (fit_state IN ('FITS', 'UNKNOWN', 'TOO_BIG', 'OUTGROWN')),
  image_uri varchar(1024),
  cutout_uri varchar(1024),
  image_processing_state varchar(24) NOT NULL DEFAULT 'NONE' CHECK (image_processing_state IN ('NONE', 'PENDING_CUTOUT', 'CUTOUT_READY', 'CUTOUT_FAILED')),
  wear_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wardrobe_items_profile_state_idx
  ON wardrobe_items(profile_id, care_state, fit_state);

CREATE TABLE IF NOT EXISTS outfit_recommendations (
  id uuid PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  context jsonb NOT NULL,
  options jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outfit_recommendations_profile_created_idx
  ON outfit_recommendations(profile_id, created_at DESC);
