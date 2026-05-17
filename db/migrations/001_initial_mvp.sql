create table if not exists users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('owner', 'provider', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists properties (
  id text primary key,
  name text not null,
  address text,
  city text not null,
  country text not null default 'France',
  owner_id text not null references users(id),
  provider_id text not null references users(id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists pools (
  id text primary key,
  property_id text references properties(id) on delete cascade,
  name text not null,
  location text not null,
  owner_id text not null references users(id),
  provider_id text not null references users(id),
  volume numeric not null,
  treatment_type text not null,
  status text not null default 'ok',
  created_at timestamptz not null default now()
);

alter table pools add column if not exists property_id text references properties(id) on delete cascade;

create table if not exists measurements (
  id text primary key,
  pool_id text not null references pools(id) on delete cascade,
  ph numeric not null,
  chlorine numeric not null,
  temperature numeric not null,
  orp numeric,
  alkalinity numeric,
  hardness numeric,
  notes text,
  measured_at timestamptz not null default now()
);

create table if not exists operational_checks (
  id text primary key,
  pool_id text not null references pools(id) on delete cascade,
  provider_id text not null references users(id),
  cover_ok boolean not null default true,
  filtration_ok boolean not null default true,
  safety_ok boolean not null default true,
  cleanliness_ok boolean not null default true,
  status text not null default 'ok',
  notes text,
  checked_at timestamptz not null default now()
);

create table if not exists interventions (
  id text primary key,
  pool_id text not null references pools(id) on delete cascade,
  provider_id text not null references users(id),
  type text not null,
  status text not null default 'scheduled',
  scheduled_at timestamptz not null,
  notes text,
  report_url text,
  created_at timestamptz not null default now()
);

create table if not exists eco_scores (
  id bigserial primary key,
  pool_id text not null references pools(id) on delete cascade,
  water_score integer not null,
  energy_score integer not null,
  chemistry_score integer not null,
  transport_score integer not null,
  co2_score integer not null,
  global_score integer not null,
  grade text not null,
  created_at timestamptz not null default now()
);

create table if not exists pool_passports (
  id text primary key,
  pool_id text not null references pools(id) on delete cascade,
  qr_code_url text,
  equipment_summary text,
  history_summary text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  pool_id text not null references pools(id) on delete cascade,
  type text not null,
  title text not null,
  period_start date,
  period_end date,
  pdf_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
