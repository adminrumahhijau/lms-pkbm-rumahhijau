-- =====================================================================
-- PKBM Rumah Hijau - skema database final
-- Jalankan SELURUHNYA di Supabase SQL Editor pada project BARU.
-- (Gabungan semua tahap; urutan: tabel -> fungsi -> RLS -> hak akses)
-- =====================================================================

-- ---------- 1) profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  google_id text unique,                       -- ID pengguna di Google Classroom
  role text not null default 'siswa' check (role in ('admin', 'tutor', 'siswa')),
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- 2) pemetaan kelas -> jenjang (sekaligus cache info kelas) ----------
create table public.course_programs (
  course_id text primary key,
  program_slug text not null check (program_slug in ('paket-a', 'paket-b', 'paket-c')),
  name text,
  section text,
  description_heading text,
  synced_at timestamptz,
  synced_by uuid references auth.users(id) on delete set null,
  sync_error text,
  created_at timestamptz not null default now()
);

-- ---------- 3) cache data Classroom ----------
create table public.course_members (
  course_id text not null references public.course_programs(course_id) on delete cascade,
  google_id text not null,
  role text not null check (role in ('teacher', 'student')),
  full_name text not null default '',
  synced_at timestamptz not null default now(),
  primary key (course_id, google_id, role)
);

create table public.materials (
  course_id text not null references public.course_programs(course_id) on delete cascade,
  id text not null,
  title text not null,
  description text not null default '',
  type text not null,
  url text not null,
  updated_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (course_id, id)
);

create table public.assignments (
  course_id text not null references public.course_programs(course_id) on delete cascade,
  id text not null,
  title text not null,
  description text not null default '',
  due_at timestamptz,
  max_points numeric,
  can_submit boolean not null default false,
  url text not null,
  created_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (course_id, id)
);

create table public.submissions (
  course_id text not null,
  assignment_id text not null,
  google_id text not null,
  state text not null,
  assigned_grade numeric,
  late boolean not null default false,
  updated_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (course_id, assignment_id, google_id),
  foreign key (course_id, assignment_id)
    references public.assignments(course_id, id) on delete cascade
);

-- Komentar guru (milik aplikasi ini; komentar pribadi Classroom tidak tersedia lewat API)
create table public.feedback (
  course_id text not null,
  assignment_id text not null,
  google_id text not null,
  comment text not null,
  author uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (course_id, assignment_id, google_id),
  foreign key (course_id, assignment_id)
    references public.assignments(course_id, id) on delete cascade
);

create index on public.course_members (google_id);
create index on public.submissions (google_id);

-- ---------- 4) fungsi bantu (security definer agar RLS tidak saling memanggil berulang) ----------
create or replace function public.my_google_id() returns text
language sql security definer set search_path = public stable
as $$ select google_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.is_member(cid text) returns boolean
language sql security definer set search_path = public stable
as $$ select exists (
  select 1 from public.course_members
  where course_id = cid and google_id = public.my_google_id()
) $$;

create or replace function public.can_manage_course(cid text) returns boolean
language sql security definer set search_path = public stable
as $$ select public.is_admin() or exists (
  select 1 from public.course_members
  where course_id = cid and role = 'teacher' and google_id = public.my_google_id()
) $$;

-- ---------- 5) Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.course_programs enable row level security;
alter table public.course_members enable row level security;
alter table public.materials enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.feedback enable row level security;

create policy "baca profil sendiri" on public.profiles
  for select using (auth.uid() = id);

create policy "baca kelas sendiri" on public.course_programs
  for select to authenticated using (public.is_member(course_id) or public.is_admin());

create policy "baca anggota" on public.course_members
  for select to authenticated using (public.is_member(course_id) or public.is_admin());
create policy "baca materi" on public.materials
  for select to authenticated using (public.is_member(course_id) or public.is_admin());
create policy "baca tugas" on public.assignments
  for select to authenticated using (public.is_member(course_id) or public.is_admin());

create policy "baca pengumpulan" on public.submissions
  for select to authenticated
  using (google_id = public.my_google_id() or public.can_manage_course(course_id));
create policy "baca komentar" on public.feedback
  for select to authenticated
  using (google_id = public.my_google_id() or public.can_manage_course(course_id));

-- ---------- 6) hak akses ----------
-- Semua penulisan dilakukan server lewat service role. Pengguna hanya boleh MEMBACA,
-- dan token Google di profiles tidak pernah bisa dibaca dari browser.
revoke all on public.profiles from anon, authenticated;
grant select (id, email, full_name, avatar_url, role, google_id, updated_at)
  on public.profiles to authenticated;

revoke all on public.course_programs, public.course_members, public.materials,
  public.assignments, public.submissions, public.feedback from anon, authenticated;
grant select on public.course_programs, public.course_members, public.materials,
  public.assignments, public.submissions, public.feedback to authenticated;

-- ---------- 8) riwayat perubahan peran (v3) ----------
create table public.role_audit (
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
revoke all on public.role_audit from anon, authenticated; -- hanya server (service role)

-- ---------- 7) contoh: jadikan seseorang tutor/admin (jalankan manual setelah ia login sekali) ----------
-- update public.profiles set role = 'tutor' where email = 'tutor@contoh.com';
-- update public.profiles set role = 'admin' where email = 'admin@contoh.com';
