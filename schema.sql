-- Schema for D1 Database (basic structure only)
-- For full initialization with data, use init_database.sql

DROP TABLE IF EXISTS cvs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE cvs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  profile_image TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_public INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_updated_at ON cvs(updated_at DESC);
CREATE INDEX idx_cvs_slug ON cvs(slug);
CREATE INDEX idx_cvs_public ON cvs(is_public);
CREATE INDEX idx_users_username ON users(username);
