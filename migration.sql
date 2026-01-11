-- Migration script to add users table and update cvs table
-- Run this if you have existing data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL
);

-- Insert default user
INSERT OR IGNORE INTO users (id, username, password_hash, email, created_at) 
VALUES (
  'user_rafael',
  'rafael',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'rafaelmoramelo@gmail.com',
  datetime('now')
);

-- Create temporary table with new schema
CREATE TABLE cvs_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_public INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Migrate existing CVs to default user
INSERT INTO cvs_new (id, user_id, name, data, slug, is_public, created_at, updated_at)
SELECT id, 'user_rafael', name, data, slug, is_public, created_at, updated_at
FROM cvs;

-- Drop old table
DROP TABLE cvs;

-- Rename new table
ALTER TABLE cvs_new RENAME TO cvs;

-- Create indexes
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_updated_at ON cvs(updated_at DESC);
CREATE INDEX idx_cvs_slug ON cvs(slug);
CREATE INDEX idx_cvs_public ON cvs(is_public);
CREATE INDEX idx_users_username ON users(username);
