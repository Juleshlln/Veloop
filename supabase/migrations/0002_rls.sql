-- ============================================================
-- Veloop — Row Level Security
--
-- Principe : les clients ne voient que leurs données ; les chauffeurs
-- voient leur profil, les courses qui leur sont attribuées et les courses
-- ouvertes ; les administrateurs voient et gèrent tout.
--
-- Les mutations applicatives passent par des Server Actions qui utilisent
-- la clé service_role (laquelle contourne la RLS). Ces politiques offrent
-- une défense en profondeur pour tout accès direct via la clé anon.
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.customer_vehicles   enable row level security;
alter table public.driver_profiles     enable row level security;
alter table public.driver_documents    enable row level security;
alter table public.saved_addresses     enable row level security;
alter table public.ride_requests       enable row level security;
alter table public.ride_status_history enable row level security;
alter table public.vehicle_inspections enable row level security;
alter table public.inspection_photos   enable row level security;
alter table public.payments            enable row level security;
alter table public.ratings             enable row level security;
alter table public.incidents           enable row level security;
alter table public.pricing_settings    enable row level security;
alter table public.notifications       enable row level security;

-- ---------------- profiles ----------------
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or public.is_admin()
  -- counterpart of a shared ride (customer <-> assigned driver)
  or exists (
    select 1 from public.ride_requests r
    where (r.customer_id = auth.uid() and r.driver_id = profiles.id)
       or (r.driver_id = auth.uid() and r.customer_id = profiles.id)
  )
);
create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- customer_vehicles ----------------
create policy vehicles_owner on public.customer_vehicles for all
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy vehicles_admin on public.customer_vehicles for select using (public.is_admin());
create policy vehicles_driver_via_ride on public.customer_vehicles for select using (
  exists (select 1 from public.ride_requests r where r.vehicle_id = customer_vehicles.id and r.driver_id = auth.uid())
);

-- ---------------- driver_profiles ----------------
create policy driver_profiles_self on public.driver_profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy driver_profiles_admin on public.driver_profiles for all
  using (public.is_admin()) with check (public.is_admin());
create policy driver_profiles_customer_via_ride on public.driver_profiles for select using (
  exists (select 1 from public.ride_requests r where r.driver_id = driver_profiles.user_id and r.customer_id = auth.uid())
);

-- ---------------- driver_documents ----------------
create policy driver_documents_self on public.driver_documents for all
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());
create policy driver_documents_admin on public.driver_documents for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- saved_addresses ----------------
create policy addresses_owner on public.saved_addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_admin on public.saved_addresses for select using (public.is_admin());

-- ---------------- ride_requests ----------------
create policy rides_select on public.ride_requests for select using (
  customer_id = auth.uid()
  or driver_id = auth.uid()
  or public.is_admin()
  -- open rides visible to approved drivers (dispatch feed)
  or (
    driver_id is null
    and status in ('requested', 'searching_driver')
    and exists (select 1 from public.driver_profiles d where d.user_id = auth.uid() and d.approval_status = 'approved')
  )
);
create policy rides_insert_customer on public.ride_requests for insert with check (customer_id = auth.uid());
create policy rides_update on public.ride_requests for update using (
  customer_id = auth.uid()
  or driver_id = auth.uid()
  or public.is_admin()
  or (driver_id is null and status in ('requested', 'searching_driver')
      and exists (select 1 from public.driver_profiles d where d.user_id = auth.uid() and d.approval_status = 'approved'))
) with check (
  customer_id = auth.uid() or driver_id = auth.uid() or public.is_admin()
);

-- ---------------- ride_status_history ----------------
create policy ride_history_select on public.ride_status_history for select using (
  public.is_admin()
  or exists (select 1 from public.ride_requests r where r.id = ride_status_history.ride_id
             and (r.customer_id = auth.uid() or r.driver_id = auth.uid()))
);
create policy ride_history_insert on public.ride_status_history for insert with check (
  public.is_admin()
  or exists (select 1 from public.ride_requests r where r.id = ride_status_history.ride_id
             and (r.customer_id = auth.uid() or r.driver_id = auth.uid()))
);

-- ---------------- vehicle_inspections ----------------
create policy inspections_participants on public.vehicle_inspections for all using (
  public.is_admin()
  or driver_id = auth.uid()
  or exists (select 1 from public.ride_requests r where r.id = vehicle_inspections.ride_id and r.customer_id = auth.uid())
) with check (
  public.is_admin()
  or driver_id = auth.uid()
  or exists (select 1 from public.ride_requests r where r.id = vehicle_inspections.ride_id and r.customer_id = auth.uid())
);

-- ---------------- inspection_photos ----------------
create policy inspection_photos_participants on public.inspection_photos for all using (
  public.is_admin()
  or exists (
    select 1 from public.vehicle_inspections vi
    join public.ride_requests r on r.id = vi.ride_id
    where vi.id = inspection_photos.inspection_id
      and (r.customer_id = auth.uid() or r.driver_id = auth.uid())
  )
) with check (true);

-- ---------------- payments ----------------
create policy payments_owner_select on public.payments for select using (customer_id = auth.uid() or public.is_admin());
create policy payments_admin_write on public.payments for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- ratings ----------------
create policy ratings_select on public.ratings for select using (
  customer_id = auth.uid() or driver_id = auth.uid() or public.is_admin()
);
create policy ratings_insert_customer on public.ratings for insert with check (customer_id = auth.uid());
create policy ratings_admin on public.ratings for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- incidents ----------------
create policy incidents_select on public.incidents for select using (reported_by = auth.uid() or public.is_admin());
create policy incidents_insert on public.incidents for insert with check (reported_by = auth.uid());
create policy incidents_admin on public.incidents for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- pricing_settings ----------------
create policy pricing_read on public.pricing_settings for select using (auth.role() = 'authenticated');
create policy pricing_admin on public.pricing_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- notifications ----------------
create policy notifications_owner on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_admin on public.notifications for select using (public.is_admin());
