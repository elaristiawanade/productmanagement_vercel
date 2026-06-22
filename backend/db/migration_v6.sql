-- Migration v6: Add file_data column for Vercel serverless file storage
-- Files are stored as base64 strings since Vercel has no persistent filesystem.
-- Run once:
--   psql -U postgres -d product_tracker -f migration_v6.sql

ALTER TABLE backlog_attachments
  ADD COLUMN IF NOT EXISTS file_data TEXT;

-- Also ensure product_roadmap table exists (migration_v5 may not have run)
CREATE TABLE IF NOT EXISTS product_roadmap (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature_name    VARCHAR(200) NOT NULL,
  description     TEXT,
  status          VARCHAR(30)  NOT NULL DEFAULT 'planned',
  product_version VARCHAR(50),
  sort_order      INTEGER      NOT NULL DEFAULT 0,
  created_by      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_product ON product_roadmap(product_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_roadmap_updated') THEN
    CREATE TRIGGER trg_roadmap_updated
      BEFORE UPDATE ON product_roadmap
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

SELECT 'Migration v6 selesai.' AS status;
