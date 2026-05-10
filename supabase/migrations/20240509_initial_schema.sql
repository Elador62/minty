-- 1. Tables (avec IF NOT EXISTS pour éviter les erreurs)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  cardmarket_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  external_order_id TEXT NOT NULL,
  buyer_name TEXT,
  buyer_address TEXT,
  total_price DECIMAL(10, 2),
  shipping_method TEXT,
  shipping_cost DECIMAL(10, 2),
  status TEXT DEFAULT 'paid', -- 'paid', 'ready', 'preparing', 'shipped', 'completed'
  source TEXT DEFAULT 'email',
  is_trust_service BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, external_order_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
  card_name TEXT NOT NULL,
  expansion TEXT,
  game TEXT,
  condition TEXT,
  language TEXT,
  is_foil BOOLEAN DEFAULT FALSE,
  is_playset BOOLEAN DEFAULT FALSE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2),
  image_url TEXT,
  is_picked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  card_name TEXT NOT NULL,
  expansion TEXT,
  scryfall_id TEXT,
  last_market_price DECIMAL(10, 2),
  listed_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Activation RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 3. Politiques (DROP avant CREATE pour mise à jour propre)
DO $$
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON profiles;
    CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON profiles FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON profiles;
    CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" ON profiles FOR UPDATE USING (auth.uid() = id);

    -- Orders
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres commandes" ON orders;
    CREATE POLICY "Les utilisateurs peuvent voir leurs propres commandes" ON orders FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leurs propres commandes" ON orders;
    CREATE POLICY "Les utilisateurs peuvent insérer leurs propres commandes" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres commandes" ON orders;
    CREATE POLICY "Les utilisateurs peuvent modifier leurs propres commandes" ON orders FOR UPDATE USING (auth.uid() = user_id);

    -- Order Items
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les items de leurs commandes" ON order_items;
    CREATE POLICY "Les utilisateurs peuvent voir les items de leurs commandes" ON order_items FOR SELECT USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

    DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer les items de leurs commandes" ON order_items;
    CREATE POLICY "Les utilisateurs peuvent insérer les items de leurs commandes" ON order_items FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

    DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les items de leurs commandes" ON order_items;
    CREATE POLICY "Les utilisateurs peuvent modifier les items de leurs commandes" ON order_items FOR UPDATE USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

    DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer les items de leurs commandes" ON order_items;
    CREATE POLICY "Les utilisateurs peuvent supprimer les items de leurs commandes" ON order_items FOR DELETE USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

    -- Inventory
    DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leur inventaire" ON inventory_items;
    CREATE POLICY "Les utilisateurs peuvent gérer leur inventaire" ON inventory_items FOR ALL USING (auth.uid() = user_id);
END $$;

-- 4. Ajout de colonnes si elles manquent (pour migrations incrémentales)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='game') THEN
        ALTER TABLE order_items ADD COLUMN game TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_cost') THEN
        ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='is_picked') THEN
        ALTER TABLE order_items ADD COLUMN is_picked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
