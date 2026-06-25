-- ============================================================
-- Veloop — Correction de la récursion RLS
-- Les sous-requêtes inter-tables dans les policies (ride_requests <->
-- driver_profiles <-> profiles) provoquaient une récursion infinie.
-- On les remplace par des fonctions SECURITY DEFINER (qui contournent la
-- RLS), ce qui casse le cycle.
-- ============================================================

create or replace function public.is_approved_driver(uid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.driver_profiles d where d.user_id = uid and d.approval_status = 'approved');
$$;
create or replace function public.shares_ride_counterpart(other uuid, me uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ride_requests r where (r.customer_id = me and r.driver_id = other) or (r.driver_id = me and r.customer_id = other));
$$;
create or replace function public.customer_has_ride_with_driver(driver uuid, me uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ride_requests r where r.driver_id = driver and r.customer_id = me);
$$;
create or replace function public.driver_has_ride_with_vehicle(vehicle uuid, me uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ride_requests r where r.vehicle_id = vehicle and r.driver_id = me);
$$;
create or replace function public.is_ride_participant(ride uuid, me uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ride_requests r where r.id = ride and (r.customer_id = me or r.driver_id = me));
$$;
create or replace function public.is_inspection_participant(insp uuid, me uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vehicle_inspections vi join public.ride_requests r on r.id = vi.ride_id where vi.id = insp and (r.customer_id = me or r.driver_id = me));
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_approved_driver(uuid) to authenticated;
grant execute on function public.shares_ride_counterpart(uuid, uuid) to authenticated;
grant execute on function public.customer_has_ride_with_driver(uuid, uuid) to authenticated;
grant execute on function public.driver_has_ride_with_vehicle(uuid, uuid) to authenticated;
grant execute on function public.is_ride_participant(uuid, uuid) to authenticated;
grant execute on function public.is_inspection_participant(uuid, uuid) to authenticated;
revoke all on function public.is_approved_driver(uuid) from public, anon;
revoke all on function public.shares_ride_counterpart(uuid, uuid) from public, anon;
revoke all on function public.customer_has_ride_with_driver(uuid, uuid) from public, anon;
revoke all on function public.driver_has_ride_with_vehicle(uuid, uuid) from public, anon;
revoke all on function public.is_ride_participant(uuid, uuid) from public, anon;
revoke all on function public.is_inspection_participant(uuid, uuid) from public, anon;

drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or public.is_admin() or public.shares_ride_counterpart(profiles.id, auth.uid())
);

drop policy vehicles_driver_via_ride on public.customer_vehicles;
create policy vehicles_driver_via_ride on public.customer_vehicles for select using (
  public.driver_has_ride_with_vehicle(customer_vehicles.id, auth.uid())
);

drop policy driver_profiles_customer_via_ride on public.driver_profiles;
create policy driver_profiles_customer_via_ride on public.driver_profiles for select using (
  public.customer_has_ride_with_driver(driver_profiles.user_id, auth.uid())
);

drop policy rides_select on public.ride_requests;
create policy rides_select on public.ride_requests for select using (
  customer_id = auth.uid() or driver_id = auth.uid() or public.is_admin()
  or (driver_id is null and status in ('requested','searching_driver') and public.is_approved_driver(auth.uid()))
);

drop policy rides_update on public.ride_requests;
create policy rides_update on public.ride_requests for update using (
  customer_id = auth.uid() or driver_id = auth.uid() or public.is_admin()
  or (driver_id is null and status in ('requested','searching_driver') and public.is_approved_driver(auth.uid()))
) with check (customer_id = auth.uid() or driver_id = auth.uid() or public.is_admin());

drop policy ride_history_select on public.ride_status_history;
create policy ride_history_select on public.ride_status_history for select using (
  public.is_admin() or public.is_ride_participant(ride_status_history.ride_id, auth.uid())
);
drop policy ride_history_insert on public.ride_status_history;
create policy ride_history_insert on public.ride_status_history for insert with check (
  public.is_admin() or public.is_ride_participant(ride_status_history.ride_id, auth.uid())
);

drop policy inspections_participants on public.vehicle_inspections;
create policy inspections_participants on public.vehicle_inspections for all using (
  public.is_admin() or driver_id = auth.uid() or public.is_ride_participant(vehicle_inspections.ride_id, auth.uid())
) with check (
  public.is_admin() or driver_id = auth.uid() or public.is_ride_participant(vehicle_inspections.ride_id, auth.uid())
);

drop policy inspection_photos_participants on public.inspection_photos;
create policy inspection_photos_participants on public.inspection_photos for all using (
  public.is_admin() or public.is_inspection_participant(inspection_photos.inspection_id, auth.uid())
) with check (
  public.is_admin() or public.is_inspection_participant(inspection_photos.inspection_id, auth.uid())
);
