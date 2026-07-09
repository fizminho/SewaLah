-- Run this in Supabase SQL Editor to set up the database schema

-- Users table (mirrors Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'Owner' check (role in ('Owner', 'Renter', 'Admin')),
  created_at timestamptz default now()
);

-- Properties
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  address text not null,
  rental_mode text not null default 'ByRoom' check (rental_mode in ('WholeProperty', 'ByRoom')),
  description text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz default now()
);

-- Units
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_number text not null,
  base_rent numeric(10,2) not null default 0,
  description text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz default now()
);

-- Renters
create table if not exists public.renters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  id_number text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz default now()
);

-- Renter Unit Assignments
create table if not exists public.renter_unit_assignments (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid not null references public.renters(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  start_date date not null,
  end_date date,
  monthly_rent numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  assignment_id uuid references public.renter_unit_assignments(id),
  renter_id uuid not null references public.renters(id),
  unit_id uuid not null references public.units(id),
  status text not null default 'Draft' check (status in ('Draft', 'Issued', 'Overdue', 'Paid', 'Cancelled')),
  total_amount numeric(10,2) not null default 0,
  outstanding_amount numeric(10,2) not null default 0,
  due_date date not null,
  issued_date timestamptz,
  paid_date timestamptz,
  notes text,
  is_deleted boolean not null default false,
  created_at timestamptz default now()
);

-- Invoice Line Items
create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_type text not null check (item_type in ('Rent', 'Utility', 'Maintenance', 'Other')),
  description text,
  amount numeric(10,2) not null,
  quantity int not null default 1,
  created_at timestamptz default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  invoice_id uuid not null references public.invoices(id),
  renter_id uuid not null references public.renters(id),
  amount_paid numeric(10,2) not null,
  payment_date date not null,
  payment_method text not null check (payment_method in ('BankTransfer', 'Cash', 'Cheque')),
  proof_file_path text,
  notes text,
  status text not null default 'Pending' check (status in ('Pending', 'Verified', 'Rejected')),
  created_at timestamptz default now()
);

-- =====================
-- Row Level Security
-- =====================

alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.renters enable row level security;
alter table public.renter_unit_assignments enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;

-- Users: can read/update/insert own profile
create policy "users_select" on public.users for select using (auth.uid() = id);
create policy "users_update" on public.users for update using (auth.uid() = id);
create policy "users_insert" on public.users for insert with check (auth.uid() = id);

-- Properties: owner can do everything
create policy "properties_owner" on public.properties for all using (auth.uid() = owner_id);

-- Units: owner of the property can do everything
create policy "units_owner" on public.units for all
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));

-- Renters: owner can manage their renters
create policy "renters_owner" on public.renters for all using (auth.uid() = owner_id);

-- Assignments: owner can manage
create policy "assignments_owner" on public.renter_unit_assignments for all
  using (exists (
    select 1 from public.renters r where r.id = renter_id and r.owner_id = auth.uid()
  ));

-- Invoices: owner can manage; renter can read own
create policy "invoices_owner" on public.invoices for all
  using (exists (
    select 1 from public.renters r where r.id = renter_id and r.owner_id = auth.uid()
  ));
create policy "invoices_renter_read" on public.invoices for select
  using (exists (
    select 1 from public.users u
    join public.renters r on r.email = u.email
    where u.id = auth.uid() and r.id = renter_id
  ));

-- Line items: follow invoice access
create policy "line_items_owner" on public.invoice_line_items for all
  using (exists (
    select 1 from public.invoices i
    join public.renters r on r.id = i.renter_id
    where i.id = invoice_id and r.owner_id = auth.uid()
  ));

-- Payments: owner can manage; renter can insert/read own
create policy "payments_owner" on public.payments for all
  using (exists (
    select 1 from public.renters r where r.id = renter_id and r.owner_id = auth.uid()
  ));
create policy "payments_renter" on public.payments for select
  using (exists (
    select 1 from public.users u
    join public.renters r on r.email = u.email
    where u.id = auth.uid() and r.id = renter_id
  ));

-- =====================
-- Storage bucket
-- =====================
-- Run in Supabase Dashboard > Storage > New Bucket: "payment-proofs" (public)
-- Or via SQL:
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', true)
  on conflict do nothing;

create policy "payment_proofs_upload" on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and auth.role() = 'authenticated');

create policy "payment_proofs_read" on storage.objects for select
  using (bucket_id = 'payment-proofs');
