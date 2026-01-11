-- Migration to add email verification and profile image support

-- Add email verification columns to users table
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;

-- Add profile_image column to cvs table
ALTER TABLE cvs ADD COLUMN profile_image TEXT;

-- Create index for email verification token
CREATE INDEX IF NOT EXISTS idx_users_email_verification ON users(email_verification_token);
