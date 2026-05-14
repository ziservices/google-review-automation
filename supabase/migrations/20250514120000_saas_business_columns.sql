-- ReviewFlow SaaS: business account columns (Project Brief §6)
-- Apply in Supabase SQL editor or via `supabase db push`.

alter table public.businesses
  add column if not exists is_active boolean not null default true,
  add column if not exists plan text not null default 'basic',
  add column if not exists owner_email text;

comment on column public.businesses.is_active is 'When false, the public review landing page is disabled.';
comment on column public.businesses.plan is 'Feature tier: basic, pro, or enterprise.';
comment on column public.businesses.owner_email is 'Client owner email for future dashboard login (Supabase Auth).';

-- App server env (Vercel / .env.local), not SQL:
-- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY — browser + middleware
-- SUPABASE_SERVICE_ROLE_KEY — API routes: super-admin CRUD, QR, scoped analytics
-- REVIEWFLOW_SUPER_ADMIN_SECRET — Bearer or x-reviewflow-super-admin-secret for /api/super-admin/*
-- NEXT_PUBLIC_APP_URL — optional canonical origin for QR targets
