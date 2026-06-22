-- Migration v2: User-Product assignments + Backlog Attachments
-- Run once on existing database:
--   psql -U postgres -d product_tracker -f migration_v2.sql

-- ─── USER PRODUCTS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_products (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_products_user    ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product ON user_products(product_id);

-- Assign default products: super_admin + manager get all products
INSERT INTO user_products (user_id, product_id)
SELECT u.id, p.id
FROM users u
JOIN roles r ON r.id = u.role_id
CROSS JOIN products p
WHERE r.name IN ('super_admin','manager')
ON CONFLICT DO NOTHING;

-- ─── BACKLOG ATTACHMENTS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS backlog_attachments (
  id              SERIAL PRIMARY KEY,
  backlog_item_id INTEGER      NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
  filename        VARCHAR(255) NOT NULL,
  original_name   VARCHAR(255) NOT NULL,
  file_size       INTEGER,
  mime_type       VARCHAR(100),
  uploaded_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backlog_attachments ON backlog_attachments(backlog_item_id);

SELECT 'Migration v2 selesai.' AS status;
