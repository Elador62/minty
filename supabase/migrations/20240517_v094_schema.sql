-- Migration: V0.9.4 schema updates
-- 1. Update orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- 2. Update inventory_items table
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS product_url TEXT;

--3. Date de mise à jour
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone null default now();
