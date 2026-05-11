ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS price_alert_period_days INTEGER DEFAULT 30;
