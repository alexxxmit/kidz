ALTER TABLE try_on_jobs
  ADD COLUMN IF NOT EXISTS fal_status_url varchar(2048),
  ADD COLUMN IF NOT EXISTS fal_response_url varchar(2048);
