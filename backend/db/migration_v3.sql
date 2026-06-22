-- Migration v3: Notifications + Item Activities (Comments & Change Log)
-- Run once on existing database:
--   psql -U postgres -d product_tracker -f migration_v3.sql

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50)  NOT NULL DEFAULT 'assignment',
  title      VARCHAR(255) NOT NULL,
  message    TEXT,
  link       VARCHAR(500),
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ─── ITEM ACTIVITIES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS item_activities (
  id              SERIAL PRIMARY KEY,
  backlog_item_id INTEGER      NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
  user_id         INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  type            VARCHAR(20)  NOT NULL DEFAULT 'comment',
  content         TEXT         NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_activities ON item_activities(backlog_item_id, created_at);

SELECT 'Migration v3 selesai.' AS status;
