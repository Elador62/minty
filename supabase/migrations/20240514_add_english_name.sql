-- Migration: Add English card name to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS card_name_en TEXT;
