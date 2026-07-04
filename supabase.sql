create table if not exists registrations (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  player1 text not null, player2 text not null, phone text not null,
  category text not null check (category in ('Oro','Plata','Infantil')),
  slot text, paid boolean default false, notes text
);
create table if not exists matches (
  id uuid primary key default gen_random_uuid(), fixture_id text unique not null, created_at timestamptz default now(),
  day text not null, start_time text not null, end_time text not null, court text not null,
  category text not null, stage text not null, group_name text, team1 text not null, team2 text not null,
  score text, winner text, notes text, next_match_id text, next_slot text
);
alter table registrations enable row level security; alter table matches enable row level security;
drop policy if exists "public insert registrations" on registrations; create policy "public insert registrations" on registrations for insert with check (true);
drop policy if exists "public read registrations" on registrations; create policy "public read registrations" on registrations for select using (true);
drop policy if exists "public update registrations" on registrations; create policy "public update registrations" on registrations for update using (true) with check (true);
drop policy if exists "public delete registrations" on registrations; create policy "public delete registrations" on registrations for delete using (true);
drop policy if exists "public read matches" on matches; create policy "public read matches" on matches for select using (true);
drop policy if exists "public insert matches" on matches; create policy "public insert matches" on matches for insert with check (true);
drop policy if exists "public update matches" on matches; create policy "public update matches" on matches for update using (true) with check (true);
