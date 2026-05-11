-- Migration: Update collection features
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS card_view_mode TEXT DEFAULT 'modal'; -- 'modal' or 'sheet'
