-- Migration: V0.9.3 updates
-- 1. Update inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS set_code TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS card_name_en TEXT; -- Should already exist but for safety

-- 2. Update orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

-- 3. Update user_settings for delay alerts
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS delay_shipping_orange INTEGER DEFAULT 4;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS delay_shipping_red INTEGER DEFAULT 7;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS delay_reception_orange INTEGER DEFAULT 5;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS delay_reception_red INTEGER DEFAULT 7;

-- 4. Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items ON DELETE CASCADE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS and add policies for price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre historique de prix" ON price_history;
    CREATE POLICY "Les utilisateurs peuvent voir leur propre historique de prix" ON price_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inventory_items
            WHERE inventory_items.id = price_history.inventory_item_id
            AND inventory_items.user_id = auth.uid()
        )
    );

    DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leur propre historique de prix" ON price_history;
    CREATE POLICY "Les utilisateurs peuvent insérer leur propre historique de prix" ON price_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inventory_items
            WHERE inventory_items.id = price_history.inventory_item_id
            AND inventory_items.user_id = auth.uid()
        )
    );
END $$;
