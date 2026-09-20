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

-- ------------------------------------------------------------- ratings ----
-- Visitor star ratings. The public may insert one rating per installer per
-- browser key and read only the aggregate; individual rows are owner-only.

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  installer_id uuid not null references installers(id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  -- Random id the browser stores in localStorage. Stops accidental and casual
  -- repeat voting. It is NOT authentication: anyone can clear it.
  voter_key    text not null,
  created_at   timestamptz not null default now(),
  unique (installer_id, voter_key)
);

create index if not exists reviews_installer_id_idx on reviews (installer_id);

alter table reviews enable row level security;

-- Insert only. There is deliberately no anon UPDATE policy: an anonymous
-- caller cannot prove it owns a row, so any update policy broad enough to
-- let someone edit their own rating would also let them rewrite everyone
-- else's. One vote per key, enforced by the unique constraint.
create policy "Public insert rating"
  on reviews for insert to anon
  with check (rating between 1 and 5 and length(voter_key) between 8 and 64);

create policy "Owner read reviews"
  on reviews for select to authenticated
  using (true);

create policy "Owner manage reviews"
  on reviews for all to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@example.com')
  with check ((auth.jwt() ->> 'email') = 'admin@example.com');

-- Aggregate only. security_invoker = off so the view runs as its owner and
-- can read the underlying rows; the public gets averages, never raw ratings,
-- and one request returns a few numbers instead of every rating ever left.
create or replace view installer_ratings
with (security_invoker = off) as
  select installer_id,
         round(avg(rating)::numeric, 1) as rating_avg,
         count(*)                       as rating_count
  from reviews
  group by installer_id;

grant select on installer_ratings to anon, authenticated;

-- ------------------------------------------------- listing requests ----
-- A business asking to be listed, or claiming a listing that already exists.
-- Anyone may submit; only the owner can read or act on them.
create table if not exists listing_requests (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null default 'new' check (kind in ('new','claim','correction')),
  installer_id  uuid references installers(id) on delete set null,
  company_name  text not null,
  contact_name  text,
  email         text not null,
  phone         text,
  website       text,
  province      text,
  city          text,
  message       text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note    text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index if not exists listing_requests_status_idx on listing_requests (status, created_at desc);
alter table listing_requests enable row level security;

-- No anon SELECT policy at all: a submitted request cannot be read back by
-- the public, only inserted.
create policy "Public submit listing request"
  on listing_requests for insert to anon
  with check (length(company_name) between 2 and 200 and length(email) between 5 and 200);
create policy "Owner reads listing requests"
  on listing_requests for select to authenticated using (true);
create policy "Owner updates listing requests"
  on listing_requests for update to authenticated using (true) with check (true);
create policy "Owner deletes listing requests"
  on listing_requests for delete to authenticated using (true);

-- --------------------------------------------------- announcements ----
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  body       text not null,
  link_url   text,
  link_label text,
  tone       text not null default 'info' check (tone in ('info','alert')),
  active     boolean not null default true,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table announcements enable row level security;

-- The live window is enforced in the policy, so an expired announcement
-- cannot be fetched at all rather than being filtered in the page.
create policy "Public read live announcements"
  on announcements for select to anon
  using (active and starts_at <= now() and (ends_at is null or ends_at > now()));
create policy "Owner manages announcements"
  on announcements for all to authenticated using (true) with check (true);

-- ------------------------------------------- review text + moderation ----
alter table reviews add column if not exists comment text;
alter table reviews add column if not exists status text not null default 'visible'
  check (status in ('visible','hidden'));
alter table reviews add column if not exists hidden_reason text;

drop policy if exists "Public insert rating" on reviews;
create policy "Public insert rating"
  on reviews for insert to anon
  with check (
    rating between 1 and 5
    and length(voter_key) between 8 and 64
    and (comment is null or length(comment) <= 600)
    and status = 'visible'
  );

-- Hiding a review takes its score out of the average as well as its text off
-- the listing.
create or replace view installer_ratings
with (security_invoker = off) as
  select installer_id,
         round(avg(rating)::numeric, 1) as rating_avg,
         count(*)                       as rating_count
  from reviews
  where status = 'visible'
  group by installer_id;
grant select on installer_ratings to anon, authenticated;

-- Public comment feed: the text and the score, never the voter key.
create or replace view installer_comments
with (security_invoker = off) as
  select id, installer_id, rating, comment, created_at
  from reviews
  where status = 'visible'
    and comment is not null
    and length(btrim(comment)) > 0;
grant select on installer_comments to anon, authenticated;
