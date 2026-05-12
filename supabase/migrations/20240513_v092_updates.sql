-- Migration: V0.9.2 Updates
-- Add columns to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS card_name_en TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS set_code TEXT;

-- Add shipped_at to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add delay thresholds to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS shipping_delay_orange INTEGER DEFAULT 4;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS shipping_delay_red INTEGER DEFAULT 7;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reception_delay_orange INTEGER DEFAULT 5;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reception_delay_red INTEGER DEFAULT 7;

-- Enable RLS for price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Policy for price_history
DO $$
BEGIN
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur historique de prix" ON price_history;
    CREATE POLICY "Les utilisateurs peuvent voir leur historique de prix" ON price_history FOR SELECT USING (EXISTS (
        SELECT 1 FROM inventory_items WHERE inventory_items.id = price_history.inventory_item_id AND inventory_items.user_id = auth.uid()
    ));

    DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leur historique de prix" ON price_history;
    CREATE POLICY "Les utilisateurs peuvent insérer leur historique de prix" ON price_history FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM inventory_items WHERE inventory_items.id = price_history.inventory_item_id AND inventory_items.user_id = auth.uid()
    ));
END $$;
