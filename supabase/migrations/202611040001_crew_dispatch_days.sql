-- Crew dispatch ("Điều phối thợ") and end-of-day report ("Báo cáo cuối ngày").
-- One small row per day, read on demand by date only. The table is deliberately
-- NOT added to the supabase_realtime publication: the app's live sync refetches
-- every table on any realtime change, so leaving it out keeps egress low.
create table if not exists public.crew_dispatch_days (
  date text primary key,                    -- YYYY-MM-DD (Asia/Ho_Chi_Minh)
  data jsonb not null default '{}'::jsonb,  -- { workers: {...}, report: {...} }
  version integer not null default 1,       -- optimistic concurrency check
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.crew_dispatch_days enable row level security;

-- Same access model as the other app tables (app uses its own login).
drop policy if exists "Allow public crew_dispatch_days" on public.crew_dispatch_days;
create policy "Allow public crew_dispatch_days" on public.crew_dispatch_days
  for all using (true) with check (true);
