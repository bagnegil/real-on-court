-- Real on Court — initial database schema
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- 1. Profiles (one row per app user)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  playtomic_level numeric,
  playtomic_url text,
  created_at timestamptz not null default now()
);

-- 2. Clubs
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 3. Courts (champions stored as names for now; linked to accounts later)
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs (id) on delete cascade,
  number int not null,
  champion1 text,
  champion2 text,
  created_at timestamptz not null default now()
);

-- 4. Challenges
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  court_id uuid references public.courts (id) on delete cascade,
  challenger1 text not null,
  challenger2 text not null,
  day text not null,
  time text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- 5. Matches (history)
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  court_id uuid references public.courts (id) on delete cascade,
  winner1 text,
  winner2 text,
  loser1 text,
  loser2 text,
  note text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.courts enable row level security;
alter table public.challenges enable row level security;
alter table public.matches enable row level security;

-- Everyone can read
create policy "read profiles" on public.profiles for select using (true);
create policy "read clubs" on public.clubs for select using (true);
create policy "read courts" on public.courts for select using (true);
create policy "read challenges" on public.challenges for select using (true);
create policy "read matches" on public.matches for select using (true);

-- A user manages their own profile
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- PROTOTYPE: there is no login yet, so the app talks to Supabase with the anon
-- key. These policies let anyone write game data so the app works end to end.
-- TIGHTEN once auth is built: scope to `to authenticated` and add ownership /
-- approval checks per RULES.md (player-name approval, score confirmation).
create policy "prototype update courts" on public.courts for update using (true) with check (true);
create policy "prototype insert challenges" on public.challenges for insert with check (true);
create policy "prototype update challenges" on public.challenges for update using (true) with check (true);
create policy "prototype insert matches" on public.matches for insert with check (true);

-- Auto-create a profile when a new user signs up
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

-- Seed: David Lloyd Rugby with 3 courts
insert into public.clubs (id, name)
values ('00000000-0000-0000-0000-000000000001', 'David Lloyd Rugby');

insert into public.courts (club_id, number, champion1, champion2) values
  ('00000000-0000-0000-0000-000000000001', 1, 'Carlos M.', 'Javier P.'),
  ('00000000-0000-0000-0000-000000000001', 2, null, null),
  ('00000000-0000-0000-0000-000000000001', 3, 'Ana R.', 'Lucia F.');
