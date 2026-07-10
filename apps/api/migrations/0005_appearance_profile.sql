ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS gender_presentation varchar(24) NOT NULL DEFAULT 'NOT_SPECIFIED';

ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS hair_profile jsonb NOT NULL
DEFAULT '{"length":"MEDIUM","color":"DARK_BROWN","openToColorAdvice":true}'::jsonb;

ALTER TABLE social_accounts
DROP COLUMN IF EXISTS avatar_profile;
