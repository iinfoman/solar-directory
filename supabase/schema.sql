-- Run this in your Supabase SQL editor to create the installers table

create table if not exists installers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  province text not null check (province in (
    'Western Cape','Gauteng','KwaZulu-Natal','Eastern Cape',
    'Limpopo','Mpumalanga','North West','Free State','Northern Cape'
  )),
  blurb text,
  services text[] not null default '{}',
  verified boolean not null default false,
  years_in_business integer not null default 1,
  min_system_size_kw numeric not null default 10,
  max_system_size_kw numeric not null default 1000,
  phone text,
  email text,
  website text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table installers enable row level security;

-- Allow public read access
create policy "Public read access"
  on installers
  for select
  to anon
  using (true);
