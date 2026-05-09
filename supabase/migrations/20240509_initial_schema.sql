-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  cardmarket_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Table des commandes
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  external_order_id TEXT NOT NULL, -- ID CardMarket (ex: 20231024-123456)
  buyer_name TEXT,
  buyer_address TEXT,
  total_price DECIMAL(10, 2),
  shipping_method TEXT,
  shipping_cost DECIMAL(10, 2),
  status TEXT DEFAULT 'paid', -- 'paid', 'preparing', 'shipped', 'completed'
  source TEXT DEFAULT 'email', -- 'email' ou 'api'
  is_trust_service BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, external_order_id)
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres commandes"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres commandes"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres commandes"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Table des articles (cartes) dans une commande
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
  card_name TEXT NOT NULL,
  expansion TEXT,
  condition TEXT,
  language TEXT,
  is_foil BOOLEAN DEFAULT FALSE,
  is_playset BOOLEAN DEFAULT FALSE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Les politiques pour order_items se basent sur la table orders
CREATE POLICY "Les utilisateurs peuvent voir les items de leurs commandes"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent insérer les items de leurs commandes"
  ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Table pour le suivi des prix (Stock)
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  card_name TEXT NOT NULL,
  expansion TEXT,
  scryfall_id TEXT, -- Optionnel pour les images
  last_market_price DECIMAL(10, 2),
  listed_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent gérer leur inventaire"
  ON inventory_items FOR ALL
  USING (auth.uid() = user_id);
