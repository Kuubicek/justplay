create extension if not exists "pgcrypto";

create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text,
  game_id text,
  points integer not null default 0,
  sort_order integer not null default 0,
  criteria jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  unique (user_id, achievement_id)
);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "read active achievements" on public.achievements;
create policy "read active achievements"
  on public.achievements for select
  using (is_active = true);

drop policy if exists "read own achievements" on public.user_achievements;
create policy "read own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "insert own achievements" on public.user_achievements;
create policy "insert own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

