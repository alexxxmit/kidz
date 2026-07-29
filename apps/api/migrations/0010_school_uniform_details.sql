ALTER TABLE social_accounts
  ADD COLUMN IF NOT EXISTS school_uniform_description varchar(280) NOT NULL DEFAULT '';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school_uniform_description varchar(280) NOT NULL DEFAULT '';
