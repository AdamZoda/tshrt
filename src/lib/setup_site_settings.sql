-- EXÉCUTER CE CODE DANS LE SQL EDITOR DE SUPABASE
-- --------------------------------------------------

-- 1. S'assurer que la table site_settings existe
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Activer RLS pour la sécurité
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Politique de lecture publique
CREATE POLICY "Lecture publique pour tous" ON public.site_settings
    FOR SELECT USING (true);

-- 4. Politique de modification pour les admins uniquement
CREATE POLICY "Modification réservée aux admins" ON public.site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Insérer les valeurs par défaut pour le Logo (Navbar)
INSERT INTO public.site_settings (key, value)
VALUES ('navbar', '{
    "logo_text": "BOCHARWIT",
    "logo_color": "#D4AF37"
}')
ON CONFLICT (key) DO NOTHING;

-- 6. Insérer les valeurs par défaut pour le Footer
INSERT INTO public.site_settings (key, value)
VALUES ('footer', '{
    "description": "Premium custom clothing brand based in Morocco. Bring your designs to life with our state-of-the-art heat press technology.",
    "email": "hello@bocharwit.ma",
    "phone": "+212 600 000 000",
    "socials": {
        "instagram": "#",
        "twitter": "#",
        "facebook": "#"
    }
}')
ON CONFLICT (key) DO NOTHING;

-- 7. Insérer les valeurs par défaut pour le Hero (si pas déjà là)
INSERT INTO public.site_settings (key, value)
VALUES ('hero', '{
    "badge": "Nouveauté 2025",
    "title": "CRÉE TON",
    "subtitle": "Personnalisez vos t-shirts avec notre outil 3D ultra-fluide et recevez-les chez vous.",
    "cta_text": "Démarrer la création",
    "cta_link": "/studio",
    "model_type": "tshirt",
    "shirt_color": "#111111",
    "decals": []
}')
ON CONFLICT (key) DO NOTHING;
