ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS school_dress_code varchar(24) NOT NULL DEFAULT 'FREE_STYLE';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS school_dress_code varchar(24) NOT NULL DEFAULT 'FREE_STYLE';
