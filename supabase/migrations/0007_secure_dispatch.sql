-- ============================================================
-- Veloop — Dispatch sécurisé
-- Supprime la policy qui exposait la fiche complète des chauffeurs validés
-- (n° permis, date de naissance, position) à tout utilisateur connecté.
-- Le dispatch passe désormais par un RPC SECURITY DEFINER : le client ne lit
-- jamais le vivier de chauffeurs.
-- ============================================================

drop policy if exists driver_profiles_approved_visible on public.driver_profiles;

create or replace function public.assign_nearest_driver(p_ride_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare r public.ride_requests; v_driver uuid;
begin
  select * into r from public.ride_requests where id = p_ride_id;
  if not found then raise exception 'ride not found'; end if;
  if not (public.is_admin() or r.customer_id = auth.uid()) then raise exception 'not authorized'; end if;
  if r.driver_id is not null or r.status not in ('searching_driver', 'requested') then
    return r.driver_id;
  end if;

  select d.user_id into v_driver
  from public.driver_profiles d
  where d.approval_status = 'approved' and d.is_online and d.current_latitude is not null
  order by ((d.current_latitude - r.pickup_latitude) ^ 2 + (d.current_longitude - r.pickup_longitude) ^ 2) asc
  limit 1;

  if v_driver is null then return null; end if;

  update public.ride_requests set driver_id = v_driver, status = 'driver_assigned', updated_at = now() where id = p_ride_id;
  insert into public.ride_status_history (ride_id, status, changed_by) values (p_ride_id, 'driver_assigned', auth.uid());
  perform public.create_notification(r.customer_id, 'Chauffeur trouvé', 'Un chauffeur a accepté votre course.', 'ride');
  perform public.create_notification(v_driver, 'Course attribuée', 'Une course vous a été attribuée.', 'driver');
  return v_driver;
end; $$;

revoke all on function public.assign_nearest_driver(uuid) from public, anon;
grant execute on function public.assign_nearest_driver(uuid) to authenticated;
