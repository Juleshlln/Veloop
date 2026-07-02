-- ============================================================
-- Veloop — Preuves d'inspection (assurance)
-- Double signature horodatée + bucket Storage privé pour les photos
-- d'état du véhicule prises avant le départ.
-- ============================================================

alter table public.vehicle_inspections
  add column if not exists driver_confirmed_at timestamptz,
  add column if not exists customer_confirmed_at timestamptz;

-- Bucket privé. Convention de chemin : {ride_id}/{photo_type}-{ts}.jpg
insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false)
on conflict (id) do nothing;

-- Les participants à la course (client ou chauffeur assigné) peuvent uploader.
create policy inspection_photos_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inspection-photos'
    and public.is_ride_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

-- Participants + admin peuvent lire (nécessaire pour les URLs signées).
create policy inspection_photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'inspection-photos'
    and (
      public.is_admin()
      or public.is_ride_participant(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  );
