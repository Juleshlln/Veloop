-- ============================================================
-- Veloop — Durcissement sécurité (advisors)
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fermer la surface RPC des fonctions internes / triggers (les triggers continuent de s'exécuter).
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.recompute_driver_rating() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;

revoke all on function public.create_notification(uuid, text, text, notification_type) from public, anon;
grant execute on function public.create_notification(uuid, text, text, notification_type) to authenticated;

-- Resserrer le WITH CHECK de inspection_photos.
drop policy if exists inspection_photos_participants on public.inspection_photos;
create policy inspection_photos_participants on public.inspection_photos for all using (
  public.is_admin()
  or exists (
    select 1 from public.vehicle_inspections vi
    join public.ride_requests r on r.id = vi.ride_id
    where vi.id = inspection_photos.inspection_id
      and (r.customer_id = auth.uid() or r.driver_id = auth.uid())
  )
) with check (
  public.is_admin()
  or exists (
    select 1 from public.vehicle_inspections vi
    join public.ride_requests r on r.id = vi.ride_id
    where vi.id = inspection_photos.inspection_id
      and (r.customer_id = auth.uid() or r.driver_id = auth.uid())
  )
);
