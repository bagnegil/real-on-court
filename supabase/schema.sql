-- Real on Court — database schema (current).
-- Run once on a fresh Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- Reflects the live DB after all migrations (countries/clubs/courts hierarchy,
-- players, set scores, map coordinates, and authenticated-only writes).

-- ── Tables ───────────────────────────────────────────────────────────────

-- One row per signed-in user (auto-created on sign-up by the trigger below).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  playtomic_level numeric,
  playtomic_url text,
  created_at timestamptz not null default now()
);

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references public.countries (id),
  created_at timestamptz not null default now()
);

-- Courts are crowd-sourced: created pending, hidden until an owner approves.
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs (id) on delete cascade,
  number int not null,
  champion1 text,
  champion2 text,
  status text not null default 'pending',   -- 'pending' | 'approved' | 'rejected'
  w3w text,                                  -- what3words address
  lat double precision,
  lng double precision,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  court_id uuid references public.courts (id) on delete cascade,
  challenger1 text not null,
  challenger2 text not null,
  day text not null,
  time text not null,
  status text not null default 'pending',    -- pending | accepted | declined | played
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  court_id uuid references public.courts (id) on delete cascade,
  winner1 text,
  winner2 text,
  loser1 text,
  loser2 text,
  note text,
  score text,                                -- set scores, winner-first e.g. "6-3, 6-4"
  created_at timestamptz not null default now()
);

-- Per-player details, keyed by the display name used across the app.
create table public.players (
  name text primary key,
  hometown text,
  country text,
  birth_year int,
  playtomic_level numeric,
  playtomic_url text,
  preferred_side text,                       -- 'Left' | 'Right' | 'Both'
  bio text,
  created_at timestamptz not null default now()
);

-- In-app feedback from players (owner-readable only).
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  author text,
  message text not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.countries enable row level security;
alter table public.clubs enable row level security;
alter table public.courts enable row level security;
alter table public.challenges enable row level security;
alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.feedback enable row level security;

-- Public reads (courts handled separately to hide pending ones).
create policy "read profiles" on public.profiles for select using (true);
create policy "read countries" on public.countries for select using (true);
create policy "read clubs" on public.clubs for select using (true);
create policy "read challenges" on public.challenges for select using (true);
create policy "read matches" on public.matches for select using (true);
create policy "read players" on public.players for select using (true);

-- Pending courts are visible only to the owner and the creator.
create policy "read courts" on public.courts for select using (
  status = 'approved'
  or coalesce(auth.jwt() ->> 'email', '') = 'bagnegil@gmail.com'
  or created_by = auth.uid()
);

-- A user manages their own profile.
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- Writes require a signed-in (authenticated) user. Tighten further later with
-- ownership / approval checks per RULES.md (player-name approval, score confirm).
create policy "auth insert countries" on public.countries for insert to authenticated with check (true);
create policy "auth insert clubs" on public.clubs for insert to authenticated with check (true);
create policy "auth insert courts" on public.courts for insert to authenticated with check (true);
create policy "auth update courts" on public.courts for update to authenticated using (true) with check (true);
create policy "auth insert challenges" on public.challenges for insert to authenticated with check (true);
create policy "auth update challenges" on public.challenges for update to authenticated using (true) with check (true);
create policy "auth insert matches" on public.matches for insert to authenticated with check (true);
create policy "auth insert players" on public.players for insert to authenticated with check (true);
create policy "auth update players" on public.players for update to authenticated using (true) with check (true);

-- Feedback: any signed-in user can submit; only the owner can read it.
create policy "auth insert feedback" on public.feedback for insert to authenticated with check (true);
create policy "owner read feedback" on public.feedback for select using (
  coalesce(auth.jwt() ->> 'email', '') = 'bagnegil@gmail.com'
);

-- ── Auth trigger ─────────────────────────────────────────────────────────

-- Auto-create a profile when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Player'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Seed ─────────────────────────────────────────────────────────────────

insert into public.countries (name) values
  ('England'), ('Spain'), ('Portugal'), ('France'), ('Italy'), ('Argentina');

insert into public.clubs (id, name, country_id)
values (
  '00000000-0000-0000-0000-000000000001',
  'David Lloyd Rugby',
  (select id from public.countries where name = 'England')
);

insert into public.courts (club_id, number, champion1, champion2, status) values
  ('00000000-0000-0000-0000-000000000001', 1, 'J. Smith', 'O. Bennett', 'approved'),
  ('00000000-0000-0000-0000-000000000001', 2, null, null, 'approved'),
  ('00000000-0000-0000-0000-000000000001', 3, 'L. Carter', 'H. Walker', 'approved');
