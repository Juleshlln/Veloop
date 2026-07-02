-- ============================================================
-- Veloop — Realtime
-- Diffuse les changements de statut de course et la position chauffeur.
-- postgres_changes respecte la RLS : chaque client ne reçoit que les
-- lignes qu'il a le droit de lire.
-- ============================================================

alter publication supabase_realtime add table public.ride_requests;
alter publication supabase_realtime add table public.driver_profiles;
