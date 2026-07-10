ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS avatar_profile jsonb NOT NULL
DEFAULT '{"skinTone":"WARM","hairColor":"DARK_BROWN","hairStyle":"LONG_STRAIGHT","pose":"EDITORIAL"}'::jsonb;
