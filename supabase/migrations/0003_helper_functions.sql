-- ============================================================
-- Veloop — Fonctions utilitaires
-- ============================================================

-- Insertion de notification inter-utilisateur (contourne la RLS owner-only en toute sécurité).
create or replace function public.create_notification(p_user_id uuid, p_title text, p_body text, p_type notification_type)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, body, type) values (p_user_id, p_title, p_body, p_type);
$$;
grant execute on function public.create_notification(uuid, text, text, notification_type) to authenticated;

-- Recalcule driver_profiles.average_rating à chaque évaluation.
create or replace function public.recompute_driver_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.driver_profiles
  set average_rating = coalesce((select round(avg(score)::numeric, 2) from public.ratings where driver_id = new.driver_id), 0)
  where user_id = new.driver_id;
  return new;
end;
$$;
create trigger ratings_recompute after insert or update on public.ratings
  for each row execute function public.recompute_driver_rating();
