-- ============================================================
-- Veloop — Schéma initial (PostgreSQL / Supabase)
-- Tables, enums, contraintes, index, triggers updated_at, RLS.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------------- Enums ----------------
create type user_role          as enum ('customer', 'driver', 'admin');
create type profile_status      as enum ('active', 'suspended');
create type approval_status     as enum ('pending', 'approved', 'rejected');
create type verification_status as enum ('pending', 'approved', 'rejected');
create type vehicle_type        as enum ('berline', 'citadine', 'suv', 'break', 'monospace', 'utilitaire');
create type transmission_type   as enum ('manuelle', 'automatique');
create type document_type       as enum ('permis_recto', 'permis_verso', 'piece_identite', 'justificatif_domicile', 'assurance', 'photo_velo');
create type ride_status         as enum (
  'requested', 'searching_driver', 'driver_assigned', 'driver_on_the_way',
  'driver_arrived', 'vehicle_check', 'trip_started', 'trip_in_progress',
  'trip_completed', 'cancelled', 'incident_reported'
);
create type payment_status      as enum ('pending', 'authorized', 'paid', 'failed', 'refunded');
create type incident_type       as enum ('vehicle', 'safety', 'payment', 'behaviour', 'other');
create type incident_priority   as enum ('low', 'medium', 'high');
create type incident_status     as enum ('open', 'investigating', 'resolved');
create type notification_type   as enum ('ride', 'payment', 'driver', 'document', 'system');

-- ---------------- updated_at trigger ----------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------- profiles ----------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role     not null default 'customer',
  first_name  text          not null default '',
  last_name   text          not null default '',
  email       text          not null,
  phone       text,
  avatar_url  text,
  status      profile_status not null default 'active',
  created_at  timestamptz    not null default now(),
  updated_at  timestamptz    not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Helper: is the current user an admin? SECURITY DEFINER avoids RLS recursion.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ---------------- customer_vehicles ----------------
create table public.customer_vehicles (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references public.profiles (id) on delete cascade,
  brand               text not null,
  model               text not null,
  registration_number text not null,
  color               text not null,
  vehicle_type        vehicle_type not null default 'citadine',
  transmission_type   transmission_type not null default 'manuelle',
  notes               text,
  created_at          timestamptz not null default now()
);
create index customer_vehicles_customer_idx on public.customer_vehicles (customer_id);

-- ---------------- driver_profiles ----------------
create table public.driver_profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.profiles (id) on delete cascade,
  approval_status       approval_status not null default 'pending',
  date_of_birth         date,
  driver_license_number text,
  driver_license_expiry date,
  years_of_experience   int  not null default 0,
  folding_bike_confirmed boolean not null default false,
  average_rating        numeric(3,2) not null default 0,
  completed_trips       int  not null default 0,
  is_online             boolean not null default false,
  current_latitude      double precision,
  current_longitude     double precision,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index driver_profiles_approval_idx on public.driver_profiles (approval_status);
create index driver_profiles_online_idx on public.driver_profiles (is_online);
create trigger driver_profiles_set_updated_at before update on public.driver_profiles
  for each row execute function public.set_updated_at();

-- ---------------- driver_documents ----------------
create table public.driver_documents (
  id                  uuid primary key default gen_random_uuid(),
  driver_id           uuid not null references public.profiles (id) on delete cascade,
  document_type       document_type not null,
  file_url            text,
  verification_status verification_status not null default 'pending',
  rejection_reason    text,
  created_at          timestamptz not null default now()
);
create index driver_documents_driver_idx on public.driver_documents (driver_id);

-- ---------------- saved_addresses ----------------
create table public.saved_addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  label      text not null,
  address    text not null,
  latitude   double precision not null,
  longitude  double precision not null,
  created_at timestamptz not null default now()
);
create index saved_addresses_user_idx on public.saved_addresses (user_id);

-- ---------------- ride_requests ----------------
create table public.ride_requests (
  id                              uuid primary key default gen_random_uuid(),
  customer_id                     uuid not null references public.profiles (id) on delete cascade,
  driver_id                       uuid references public.profiles (id) on delete set null,
  vehicle_id                      uuid references public.customer_vehicles (id) on delete set null,
  pickup_address                  text not null,
  pickup_latitude                 double precision not null,
  pickup_longitude                double precision not null,
  destination_address             text not null,
  destination_latitude            double precision not null,
  destination_longitude           double precision not null,
  scheduled_at                    timestamptz,
  passenger_count                 int not null default 1 check (passenger_count between 1 and 7),
  estimated_distance_km           numeric(7,2) not null,
  estimated_duration_minutes      int not null,
  estimated_driver_arrival_minutes int not null,
  estimated_price                 numeric(10,2) not null,
  final_price                     numeric(10,2),
  status                          ride_status not null default 'requested',
  customer_notes                  text,
  cancellation_reason             text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);
create index ride_requests_customer_idx on public.ride_requests (customer_id);
create index ride_requests_driver_idx on public.ride_requests (driver_id);
create index ride_requests_status_idx on public.ride_requests (status);
create index ride_requests_created_idx on public.ride_requests (created_at desc);
create trigger ride_requests_set_updated_at before update on public.ride_requests
  for each row execute function public.set_updated_at();

-- ---------------- ride_status_history ----------------
create table public.ride_status_history (
  id         uuid primary key default gen_random_uuid(),
  ride_id    uuid not null references public.ride_requests (id) on delete cascade,
  status     ride_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  latitude   double precision,
  longitude  double precision,
  created_at timestamptz not null default now()
);
create index ride_status_history_ride_idx on public.ride_status_history (ride_id);

-- ---------------- vehicle_inspections ----------------
create table public.vehicle_inspections (
  id                 uuid primary key default gen_random_uuid(),
  ride_id            uuid not null references public.ride_requests (id) on delete cascade,
  driver_id          uuid not null references public.profiles (id) on delete cascade,
  customer_confirmed boolean not null default false,
  driver_confirmed   boolean not null default false,
  initial_mileage    int,
  final_mileage      int,
  notes              text,
  created_at         timestamptz not null default now()
);
create unique index vehicle_inspections_ride_idx on public.vehicle_inspections (ride_id);

-- ---------------- inspection_photos ----------------
create table public.inspection_photos (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.vehicle_inspections (id) on delete cascade,
  photo_type    text not null,
  file_url      text not null,
  created_at    timestamptz not null default now()
);

-- ---------------- payments ----------------
create table public.payments (
  id                       uuid primary key default gen_random_uuid(),
  ride_id                  uuid not null references public.ride_requests (id) on delete cascade,
  customer_id              uuid not null references public.profiles (id) on delete cascade,
  stripe_payment_intent_id text,
  amount                   numeric(10,2) not null,
  currency                 text not null default 'EUR',
  status                   payment_status not null default 'pending',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index payments_customer_idx on public.payments (customer_id);
create unique index payments_ride_idx on public.payments (ride_id);
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------- ratings ----------------
create table public.ratings (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references public.ride_requests (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  driver_id   uuid not null references public.profiles (id) on delete cascade,
  score       int  not null check (score between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);
create unique index ratings_ride_idx on public.ratings (ride_id);
create index ratings_driver_idx on public.ratings (driver_id);

-- ---------------- incidents ----------------
create table public.incidents (
  id            uuid primary key default gen_random_uuid(),
  ride_id       uuid references public.ride_requests (id) on delete set null,
  reported_by   uuid not null references public.profiles (id) on delete cascade,
  incident_type incident_type not null,
  description   text not null,
  priority      incident_priority not null default 'medium',
  status        incident_status not null default 'open',
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index incidents_status_idx on public.incidents (status);

-- ---------------- pricing_settings ----------------
create table public.pricing_settings (
  id               uuid primary key default gen_random_uuid(),
  base_fee         numeric(10,2) not null default 15,
  price_per_km     numeric(10,2) not null default 1.5,
  price_per_minute numeric(10,2) not null default 0.35,
  minimum_price    numeric(10,2) not null default 29,
  night_multiplier numeric(4,2)  not null default 1.2,
  surge_multiplier numeric(4,2)  not null default 1.0,
  updated_at       timestamptz   not null default now()
);
create trigger pricing_settings_set_updated_at before update on public.pricing_settings
  for each row execute function public.set_updated_at();

-- ---------------- notifications ----------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text not null,
  type       notification_type not null default 'system',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ============================================================
-- Auto-create a profile when a new auth user signs up.
-- Role & names are read from the sign-up metadata.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  if coalesce(new.raw_user_meta_data ->> 'role', 'customer') = 'driver' then
    insert into public.driver_profiles (user_id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
