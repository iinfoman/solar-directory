-- SolarDirectory South Africa — database schema
--
-- This file mirrors the live Supabase project (SolarinstallersSA). Run it in
-- the SQL editor to recreate the project from scratch.
--
-- BEFORE RUNNING: replace 'admin@example.com' below with the email address of
-- the account that should own the directory. Every write policy is gated on
-- that address. The live project uses the owner's real email; it is not
-- committed here because this repository is public.
--
-- Note the trade-off in this approach: the admin identity is the JWT email
-- claim, so changing the account's email address revokes its own access. If
-- more than one admin is ever needed, replace these predicates with a lookup
-- against an `admins` table keyed on auth.uid().

-- ---------------------------------------------------------------- tables ---

create table if not exists installers (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  city               text not null,
  province           text not null check (province in (
                       'Western Cape','Gauteng','KwaZulu-Natal','Eastern Cape',
                       'Limpopo','Mpumalanga','North West','Free State','Northern Cape'
                     )),
  blurb              text,
  services           text[] not null default '{}',
  verified           boolean not null default false,
  years_in_business  integer not null default 1,
  min_system_size_kw numeric not null default 10,
  max_system_size_kw numeric not null default 1000,
  phone              text,
  email              text,
  website            text,
  featured_national  boolean not null default false,
  featured_province  boolean not null default false,
  sort_boost         integer not null default 0,
  is_active          boolean not null default true,
  logo_url           text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- At most one installer may hold the national feature slot at a time.
create unique index if not exists one_national_feature
  on installers ((true)) where (featured_national = true);

create table if not exists ads (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  subtitle      text,
  discount_text text,
  image_url     text,
  cta_url       text,
  installer_id  uuid references installers(id) on delete set null,
  active        boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists settings (
  key   text primary key,
  value text not null
);

insert into settings (key, value) values ('ads_enabled', 'true')
  on conflict (key) do nothing;

-- -------------------------------------------------------------- triggers ---

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_installers_updated_at on installers;
create trigger trg_installers_updated_at
  before update on installers
  for each row execute function set_updated_at();

drop trigger if exists trg_ads_updated_at on ads;
create trigger trg_ads_updated_at
  before update on ads
  for each row execute function set_updated_at();

-- ------------------------------------------------------------------ RLS ---
-- Anonymous visitors read only what is published. All writes require a signed
-- in session whose email claim matches the admin address.

alter table installers enable row level security;
alter table ads        enable row level security;
alter table settings   enable row level security;

-- installers
create policy "Public read active"
  on installers for select to anon
  using (is_active = true);

create policy "Owner read all"
  on installers for select to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Owner insert"
  on installers for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Owner update"
  on installers for update to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@example.com')
  with check ((auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Owner delete"
  on installers for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@example.com');

-- ads
create policy "Public read active ads"
  on ads for select to anon
  using (active = true);

create policy "Owner read all ads"
  on ads for select to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Owner write ads"
  on ads for all to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@example.com')
  with check ((auth.jwt() ->> 'email') = 'admin@example.com');

-- settings
create policy "Public read settings"
  on settings for select to anon
  using (true);

create policy "Owner read settings"
  on settings for select to authenticated
  using (true);

create policy "Owner write settings"
  on settings for update to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@example.com')
  with check ((auth.jwt() ->> 'email') = 'admin@example.com');

-- -------------------------------------------------------------- storage ---
-- Installer logos and advert images. Public read, admin-only write.

insert into storage.buckets (id, name, public)
  values ('directory-assets', 'directory-assets', true)
  on conflict (id) do nothing;

create policy "Public read directory-assets"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'directory-assets');

create policy "Owner upload directory-assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'directory-assets'
              and (auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Owner update directory-assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'directory-assets'
         and (auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Owner delete directory-assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'directory-assets'
         and (auth.jwt() ->> 'email') = 'admin@example.com');
