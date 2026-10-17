-- Expense Tracker schema for Supabase PostgreSQL.
-- Run this file in the Supabase SQL Editor as the project owner.
-- Never expose the service_role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null,
  description text not null default '',
  transaction_date date not null default current_date,
  payment_method text not null default 'Cash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  monthly_limit numeric(14,2) not null check (monthly_limit > 0),
  currency text not null default 'BDT' check (currency = 'BDT'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index if not exists transactions_user_type_idx
  on public.transactions (user_id, type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at before update on public.budgets
for each row execute function public.set_updated_at();

-- Create one profile for each new auth user. Role is always 'user' at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- A signed-in user can read their own profile. Only project owners/admins
-- should assign roles via SQL; there is intentionally no user-facing role update policy.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));

drop policy if exists "Users can update own profile name" on public.profiles;
create policy "Users can update own profile name" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = 'user');

-- User-owned transactions only. No cross-account access is granted to admins
-- by these policies; admin reporting requires a separate, deliberately designed secure path.
drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions" on public.transactions
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions" on public.transactions
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions" on public.transactions
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions" on public.transactions
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can read own budget" on public.budgets;
create policy "Users can read own budget" on public.budgets
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own budget" on public.budgets;
create policy "Users can insert own budget" on public.budgets
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own budget" on public.budgets;
create policy "Users can update own budget" on public.budgets
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Explicit grants pair with RLS; RLS remains the row-level security boundary.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update on public.budgets to authenticated;
