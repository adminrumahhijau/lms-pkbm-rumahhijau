-- v3: riwayat perubahan peran pengguna (jalankan sekali di SQL Editor pada database yang sudah ada)
create table if not exists public.role_audit (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id) on delete set null,
  target uuid references auth.users(id) on delete set null,
  actor_email text,
  target_email text,
  old_role text not null,
  new_role text not null,
  created_at timestamptz not null default now()
);

alter table public.role_audit enable row level security;
-- Tanpa kebijakan RLS dan tanpa hak akses: hanya server (service role) yang bisa membaca/menulis.
revoke all on public.role_audit from anon, authenticated;
