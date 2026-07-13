CREATE TABLE IF NOT EXISTS try_on_jobs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fal_request_id varchar(128) NOT NULL UNIQUE,
  model_id varchar(160) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
  result_url varchar(2048),
  error_code varchar(80),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS try_on_jobs_user_created_idx
  ON try_on_jobs(user_id, created_at DESC);
