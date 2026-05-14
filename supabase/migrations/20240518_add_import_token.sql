-- Migration: Add import_token to user_settings for email automation
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS import_token UUID UNIQUE;

-- Create an index for faster lookups when receiving emails
CREATE INDEX IF NOT EXISTS idx_user_settings_import_token ON user_settings(import_token);
