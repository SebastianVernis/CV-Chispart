-- Migration to add leads, subscriptions and invoices tables
-- Run this with: wrangler d1 execute cv_database --file=./migration_leads_subscriptions.sql --remote

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  plan_selected TEXT NOT NULL,
  requires_invoice INTEGER DEFAULT 0,
  requires_custom_solution INTEGER DEFAULT 0,
  custom_solution_description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lead_id TEXT,
  plan TEXT NOT NULL,
  price REAL NOT NULL,
  includes_iva INTEGER DEFAULT 0,
  iva_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'trial',
  trial_start TEXT NOT NULL,
  trial_end TEXT NOT NULL,
  payment_verified INTEGER DEFAULT 0,
  payment_verified_at TEXT,
  subscription_start TEXT,
  subscription_end TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  subtotal REAL NOT NULL,
  iva_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  issued_at TEXT NOT NULL,
  sent_at TEXT,
  paid_at TEXT,
  pdf_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Add new columns to users table (if they don't exist)
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we'll try to add them
-- If they already exist, the migration will fail but can be ignored

ALTER TABLE users ADD COLUMN subscription_id TEXT;
ALTER TABLE users ADD COLUMN trial_active INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
