CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  kanban_colors JSONB DEFAULT '{
    "paid": "#ffedd5",
    "ready": "#dcfce7",
    "preparing": "#dbeafe",
    "shipped": "#f3e8ff",
    "completed": "#f0fdf4"
  }'::jsonb,
  price_sources TEXT[] DEFAULT ARRAY['Trend CardMarket', 'Avg Sell CardMarket'],
  price_alert_threshold DECIMAL(5, 2) DEFAULT 10.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leurs paramètres" ON user_settings;
    CREATE POLICY "Les utilisateurs peuvent gérer leurs paramètres" ON user_settings FOR ALL USING (auth.uid() = user_id);
END $$;
