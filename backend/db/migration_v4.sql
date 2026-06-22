-- Migration v4: Standup module
-- Run once on existing database:
--   psql -U postgres -d product_tracker -f migration_v4.sql

CREATE TABLE IF NOT EXISTS standups (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  standup_date   DATE      NOT NULL,
  yesterday      TEXT      NOT NULL,
  today          TEXT      NOT NULL,
  has_blocker    BOOLEAN   NOT NULL DEFAULT FALSE,
  blocker        TEXT,
  blocker_plan   TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, standup_date)
);

CREATE INDEX IF NOT EXISTS idx_standups_user_date ON standups(user_id, standup_date);
CREATE INDEX IF NOT EXISTS idx_standups_date      ON standups(standup_date DESC);

-- updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_standups_updated'
  ) THEN
    CREATE TRIGGER trg_standups_updated
      BEFORE UPDATE ON standups
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

SELECT 'Migration v4 selesai.' AS status;
