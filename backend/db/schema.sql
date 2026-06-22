-- Product Tracker - Database Schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ROLES ──────────────────────────────────────────────────────────────────

CREATE TABLE roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  permissions JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── USERS ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id       INTEGER      REFERENCES roles(id) ON DELETE SET NULL,
  avatar_color  VARCHAR(20)  DEFAULT '#4F46E5',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ───────────────────────────────────────────────────────────────

CREATE TABLE products (
  id             SERIAL PRIMARY KEY,
  code           VARCHAR(20)  NOT NULL UNIQUE,
  name           VARCHAR(100) NOT NULL,
  description    TEXT,
  status         VARCHAR(30)  NOT NULL DEFAULT 'active',  -- active, on_hold, archived
  owner_id       INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  repository_url VARCHAR(255),
  color          VARCHAR(20)  NOT NULL DEFAULT '#4F46E5',
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── EPICS ──────────────────────────────────────────────────────────────────

CREATE TABLE epics (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code        VARCHAR(20)  NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(30)  NOT NULL DEFAULT 'open',   -- open, in_progress, closed
  priority    VARCHAR(20)  NOT NULL DEFAULT 'medium', -- critical, high, medium, low
  created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, code)
);

-- ─── FEATURES ───────────────────────────────────────────────────────────────

CREATE TABLE features (
  id             SERIAL PRIMARY KEY,
  product_id     INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  epic_id        INTEGER      REFERENCES epics(id) ON DELETE SET NULL,
  code           VARCHAR(20)  NOT NULL,
  name           VARCHAR(200) NOT NULL,
  owner_id       INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  status         VARCHAR(30)  NOT NULL DEFAULT 'not_started',
  priority       VARCHAR(20)  NOT NULL DEFAULT 'medium',
  target_release VARCHAR(20),
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, code)
);

-- ─── SPRINTS ────────────────────────────────────────────────────────────────

CREATE TABLE sprints (
  id               SERIAL PRIMARY KEY,
  product_id       INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  goal             TEXT,
  start_date       DATE,
  end_date         DATE,
  capacity         INTEGER      NOT NULL DEFAULT 0,
  committed_points INTEGER      NOT NULL DEFAULT 0,
  completed_points INTEGER      NOT NULL DEFAULT 0,
  status           VARCHAR(20)  NOT NULL DEFAULT 'planned', -- planned, active, completed
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, name)
);

-- ─── BACKLOG ITEMS ──────────────────────────────────────────────────────────

CREATE TABLE backlog_items (
  id                  SERIAL PRIMARY KEY,
  product_id          INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code                VARCHAR(20)  NOT NULL,
  title               TEXT         NOT NULL,
  type                VARCHAR(20)  NOT NULL DEFAULT 'story', -- story, bug, task, epic
  feature_id          INTEGER      REFERENCES features(id) ON DELETE SET NULL,
  epic_id             INTEGER      REFERENCES epics(id) ON DELETE SET NULL,
  priority            VARCHAR(20)  NOT NULL DEFAULT 'medium',
  story_points        INTEGER      NOT NULL DEFAULT 0,
  status              VARCHAR(30)  NOT NULL DEFAULT 'todo', -- todo, in_progress, in_review, done, blocked, backlog
  sprint_id           INTEGER      REFERENCES sprints(id) ON DELETE SET NULL,
  assignee_id         INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  parent_id           INTEGER      REFERENCES backlog_items(id) ON DELETE SET NULL,
  acceptance_criteria TEXT,
  notes               TEXT,
  deadline            DATE,
  created_by          INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, code)
);

-- ─── BURNDOWN DATA ──────────────────────────────────────────────────────────

CREATE TABLE burndown_data (
  id               SERIAL PRIMARY KEY,
  sprint_id        INTEGER       NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  day              INTEGER       NOT NULL,
  ideal_remaining  DECIMAL(10,2),
  actual_remaining DECIMAL(10,2),
  recorded_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE(sprint_id, day)
);

-- ─── QA TEST CASES ──────────────────────────────────────────────────────────

CREATE TABLE qa_test_cases (
  id               SERIAL PRIMARY KEY,
  backlog_item_id  INTEGER      NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
  product_id       INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code             VARCHAR(20)  NOT NULL,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  steps            TEXT,
  expected_result  TEXT,
  status           VARCHAR(30)  NOT NULL DEFAULT 'draft', -- draft, active, deprecated
  priority         VARCHAR(20)  NOT NULL DEFAULT 'medium',
  created_by       INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── QA TEST RUNS ────────────────────────────────────────────────────────────

CREATE TABLE qa_test_runs (
  id             SERIAL PRIMARY KEY,
  test_case_id   INTEGER      NOT NULL REFERENCES qa_test_cases(id) ON DELETE CASCADE,
  sprint_id      INTEGER      REFERENCES sprints(id) ON DELETE SET NULL,
  tester_id      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  result         VARCHAR(20)  NOT NULL DEFAULT 'pending', -- pending, pass, fail, blocked, skip
  notes          TEXT,
  bug_reference  VARCHAR(50),
  executed_at    TIMESTAMP,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── USER PRODUCTS (many-to-many) ───────────────────────────────────────────

CREATE TABLE user_products (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- ─── BACKLOG ATTACHMENTS ─────────────────────────────────────────────────────

CREATE TABLE backlog_attachments (
  id              SERIAL PRIMARY KEY,
  backlog_item_id INTEGER      NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
  filename        VARCHAR(255) NOT NULL,
  original_name   VARCHAR(255) NOT NULL,
  file_size       INTEGER,
  mime_type       VARCHAR(100),
  uploaded_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── STANDUPS ────────────────────────────────────────────────────────────────

CREATE TABLE standups (
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

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50)  NOT NULL DEFAULT 'assignment',
  title      VARCHAR(255) NOT NULL,
  message    TEXT,
  link       VARCHAR(500),
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── ITEM ACTIVITIES (comments + change log) ────────────────────────────────

CREATE TABLE item_activities (
  id              SERIAL PRIMARY KEY,
  backlog_item_id INTEGER      NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
  user_id         INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  type            VARCHAR(20)  NOT NULL DEFAULT 'comment',  -- comment | change_log
  content         TEXT         NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX idx_backlog_product ON backlog_items(product_id);
CREATE INDEX idx_backlog_parent  ON backlog_items(parent_id);
CREATE INDEX idx_backlog_sprint  ON backlog_items(sprint_id);
CREATE INDEX idx_backlog_status  ON backlog_items(status);
CREATE INDEX idx_backlog_assignee ON backlog_items(assignee_id);
CREATE INDEX idx_backlog_deadline ON backlog_items(deadline);
CREATE INDEX idx_sprints_product  ON sprints(product_id);
CREATE INDEX idx_sprints_status   ON sprints(status);
CREATE INDEX idx_features_product ON features(product_id);
CREATE INDEX idx_epics_product    ON epics(product_id);
CREATE INDEX idx_qa_tc_backlog    ON qa_test_cases(backlog_item_id);
CREATE INDEX idx_qa_tc_product    ON qa_test_cases(product_id);
CREATE INDEX idx_qa_runs_case     ON qa_test_runs(test_case_id);
CREATE INDEX idx_qa_runs_sprint   ON qa_test_runs(sprint_id);
CREATE INDEX idx_user_products_user    ON user_products(user_id);
CREATE INDEX idx_user_products_product ON user_products(product_id);
CREATE INDEX idx_backlog_attachments   ON backlog_attachments(backlog_item_id);
CREATE INDEX idx_standups_user_date    ON standups(user_id, standup_date);
CREATE INDEX idx_standups_date         ON standups(standup_date DESC);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_item_activities       ON item_activities(backlog_item_id, created_at);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated  BEFORE UPDATE ON products  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_epics_updated     BEFORE UPDATE ON epics     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_features_updated  BEFORE UPDATE ON features  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sprints_updated   BEFORE UPDATE ON sprints   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_backlog_updated   BEFORE UPDATE ON backlog_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_standups_updated  BEFORE UPDATE ON standups     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_qa_tc_updated     BEFORE UPDATE ON qa_test_cases FOR EACH ROW EXECUTE FUNCTION set_updated_at();
