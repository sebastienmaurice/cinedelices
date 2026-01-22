ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS delete_request_status VARCHAR(20) DEFAULT 'none';

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS delete_request_by INT REFERENCES users(id);

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS delete_request_at TIMESTAMP;
