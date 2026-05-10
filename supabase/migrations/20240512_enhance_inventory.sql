-- Migration: Enhance inventory_items for Collection module
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS storage_location TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cardmarket_url TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS rarity TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS game TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS card_type TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_foil BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS external_id TEXT; -- To store ArticleID or idProduct from CSV
