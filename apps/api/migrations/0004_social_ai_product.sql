CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  install_hash varchar(64) NOT NULL,
  age_years integer NOT NULL CHECK (age_years BETWEEN 0 AND 18),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nickname varchar(30) NOT NULL,
  handle varchar(24) NOT NULL UNIQUE,
  locale varchar(5) NOT NULL CHECK (locale IN ('ru', 'en')),
  age_years integer NOT NULL CHECK (age_years BETWEEN 0 AND 18),
  age_mode varchar(24) NOT NULL CHECK (age_mode IN ('FAMILY', 'CO_CREATE', 'PRIVATE_TEEN', 'SOCIAL_TEEN')),
  privacy_state varchar(16) NOT NULL CHECK (privacy_state IN ('PRIVATE', 'CIRCLE', 'PUBLIC')),
  avatar_uri varchar(1024),
  style_mix jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follows (
  follower_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  target_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  status varchar(16) NOT NULL CHECK (status IN ('REQUESTED', 'ACCEPTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_account_id, target_account_id),
  CHECK (follower_account_id <> target_account_id)
);

CREATE TABLE IF NOT EXISTS look_posts (
  id uuid PRIMARY KEY,
  author_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  outfit jsonb NOT NULL,
  caption varchar(500) NOT NULL DEFAULT '',
  style_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility varchar(16) NOT NULL CHECK (visibility IN ('PRIVATE', 'CIRCLE', 'PUBLIC')),
  moderation_state varchar(20) NOT NULL DEFAULT 'CLEAN' CHECK (moderation_state IN ('CLEAN', 'PENDING', 'HIDDEN', 'REMOVED')),
  challenge_id uuid,
  remix_of_post_id uuid REFERENCES look_posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS look_posts_author_created_idx ON look_posts(author_account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS look_reactions (
  post_id uuid NOT NULL REFERENCES look_posts(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  kind varchar(16) NOT NULL CHECK (kind IN ('LOVE', 'INSPIRED', 'WOW')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, account_id)
);

CREATE TABLE IF NOT EXISTS look_comments (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES look_posts(id) ON DELETE CASCADE,
  author_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  body varchar(500) NOT NULL,
  moderation_state varchar(20) NOT NULL DEFAULT 'CLEAN' CHECK (moderation_state IN ('CLEAN', 'PENDING', 'HIDDEN', 'REMOVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS look_comments_post_created_idx ON look_comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  blocked_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_account_id, blocked_account_id),
  CHECK (blocker_account_id <> blocked_account_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY,
  safety_state varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (safety_state IN ('OPEN', 'RESTRICTED', 'CLOSED')),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, account_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  body varchar(1200) NOT NULL,
  moderation_state varchar(20) NOT NULL DEFAULT 'CLEAN' CHECK (moderation_state IN ('CLEAN', 'PENDING', 'HIDDEN', 'REMOVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY,
  reporter_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  target_type varchar(20) NOT NULL CHECK (target_type IN ('ACCOUNT', 'LOOK_POST', 'MESSAGE')),
  target_id uuid NOT NULL,
  reason varchar(24) NOT NULL,
  details varchar(500),
  status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVIEWING', 'RESOLVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan varchar(20) NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PLUS', 'FAMILY')),
  source varchar(24) NOT NULL DEFAULT 'NONE',
  active boolean NOT NULL DEFAULT false,
  renews_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
