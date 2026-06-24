-- ============================================================
-- Veloop — Données de démonstration (Supabase)
--
-- Note : les profils sont liés à auth.users. En production, créez les
-- comptes via Supabase Auth (le trigger on_auth_user_created crée le profil
-- automatiquement à partir des métadonnées role/first_name/last_name).
--
-- Ce fichier initialise uniquement les paramètres tarifaires, qui ne
-- dépendent d'aucun utilisateur. Le jeu de données complet (clients,
-- chauffeurs, courses, avis, incidents) est fourni en mémoire par le mode
-- démonstration de l'application — voir lib/demo/seed.ts.
-- ============================================================

insert into public.pricing_settings (base_fee, price_per_km, price_per_minute, minimum_price, night_multiplier, surge_multiplier)
values (15, 1.5, 0.35, 29, 1.2, 1.0)
on conflict do nothing;
