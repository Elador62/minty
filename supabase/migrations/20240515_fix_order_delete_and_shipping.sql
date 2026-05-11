-- Migration: Add delete policy for orders and shipping_methods to user_settings
DO $$
BEGIN
    DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres commandes" ON orders;
    CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres commandes" ON orders FOR DELETE USING (auth.uid() = user_id);

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='shipping_methods') THEN
        ALTER TABLE user_settings ADD COLUMN shipping_methods TEXT[] DEFAULT ARRAY['Lettre Internationale (Priority Letter)(max. 20g)', 'Lettre Verte(max. 20g)', 'Lettre Verte Suivi(max. 20g)'];
    END IF;
END $$;
