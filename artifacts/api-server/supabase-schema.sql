-- Run this script once in Supabase SQL Editor.
create table if not exists public.amal_users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.amal_sessions (
  token text primary key,
  user_id text not null references public.amal_users(id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists amal_sessions_expires_at_idx on public.amal_sessions(expires_at);

alter table public.amal_users enable row level security;
alter table public.amal_sessions enable row level security;

-- The API uses SUPABASE_SERVICE_ROLE_KEY and performs all access server-side.
-- Passwords are managed by Supabase Auth, not by this table.
alter table public.amal_users alter column password_hash drop not null;
