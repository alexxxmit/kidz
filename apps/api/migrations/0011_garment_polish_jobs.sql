CREATE TABLE IF NOT EXISTS garment_polish_jobs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fal_request_id varchar(128) NOT NULL,
  model_id varchar(160) NOT NULL,
  fal_status_url varchar(2048) NOT NULL,
  fal_response_url varchar(2048) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'QUEUED',
  result_url varchar(2048),
  error_code varchar(80),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS garment_polish_jobs_fal_request_idx
  ON garment_polish_jobs(fal_request_id);

CREATE INDEX IF NOT EXISTS garment_polish_jobs_user_created_idx
  ON garment_polish_jobs(user_id, created_at);
