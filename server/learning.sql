-- Applied to the existing Wordville project with authenticated owner-only access.
create table public.wordville_learning (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<500000),
 version bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.wordville_learning enable row level security;
revoke all on public.wordville_learning from anon;
grant select,insert,update,delete on public.wordville_learning to authenticated;
create policy "Own learning select" on public.wordville_learning for select to authenticated using ((select auth.uid())=owner_id);
create policy "Own learning insert" on public.wordville_learning for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "Own learning update" on public.wordville_learning for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "Own learning delete" on public.wordville_learning for delete to authenticated using ((select auth.uid())=owner_id);
