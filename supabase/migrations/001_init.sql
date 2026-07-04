-- ============================================================
-- Migration: Setup awal tabel permohonan perubahan data
-- Jalankan ini di Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Extension untuk generate UUID & kode tracking acak
create extension if not exists "pgcrypto";

-- ============================================================
-- TABEL: permohonan
-- ============================================================
create table if not exists public.permohonan (
  id uuid primary key default gen_random_uuid(),
  nama_pemohon text not null,
  nik text not null,
  email text not null,
  no_telepon text not null,
  jenis_perubahan text not null,         -- contoh: 'Nama', 'Alamat', 'NPWP', dll
  data_lama text not null,
  data_baru text not null,
  alasan_perubahan text not null,
  dokumen_pendukung_url text,            -- url file di Supabase Storage
  status text not null default 'pending' -- pending | diproses | disetujui | ditolak
    check (status in ('pending', 'diproses', 'disetujui', 'ditolak')),
  surat_persetujuan_url text,            -- url file .docx hasil generate
  catatan_admin text,
  kode_tracking text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_permohonan_status on public.permohonan(status);
create index if not exists idx_permohonan_kode_tracking on public.permohonan(kode_tracking);
create index if not exists idx_permohonan_email on public.permohonan(email);

-- ============================================================
-- TABEL: riwayat_status (audit trail)
-- ============================================================
create table if not exists public.riwayat_status (
  id uuid primary key default gen_random_uuid(),
  permohonan_id uuid not null references public.permohonan(id) on delete cascade,
  status_sebelum text,
  status_sesudah text not null,
  catatan text,
  diubah_oleh text,                      -- email admin yang melakukan aksi
  created_at timestamptz not null default now()
);

create index if not exists idx_riwayat_permohonan_id on public.riwayat_status(permohonan_id);

-- ============================================================
-- TRIGGER: auto update `updated_at`
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_permohonan_updated_at on public.permohonan;
create trigger trg_permohonan_updated_at
  before update on public.permohonan
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.permohonan enable row level security;
alter table public.riwayat_status enable row level security;

-- Publik (anon) BOLEH insert permohonan baru (submit form), tapi TIDAK BOLEH
-- baca/ubah data permohonan orang lain secara bebas.
create policy "Publik dapat submit permohonan"
  on public.permohonan
  for insert
  to anon
  with check (true);

-- Publik boleh SELECT hanya untuk cek status via kode_tracking (lewat RPC/API route
-- yang memfilter berdasarkan kode_tracking, bukan select * langsung).
-- Di sini kita tidak buka SELECT publik secara langsung demi keamanan data pribadi;
-- pengecekan status dilakukan lewat API route yang pakai service role key.

-- Admin (authenticated) boleh full akses
create policy "Admin dapat select semua permohonan"
  on public.permohonan
  for select
  to authenticated
  using (true);

create policy "Admin dapat update permohonan"
  on public.permohonan
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin dapat select riwayat status"
  on public.riwayat_status
  for select
  to authenticated
  using (true);

create policy "Admin dapat insert riwayat status"
  on public.riwayat_status
  for insert
  to authenticated
  with check (true);

-- ============================================================
-- STORAGE BUCKET (jalankan terpisah, atau buat manual lewat dashboard)
-- ============================================================
-- 1. Buka Supabase Dashboard > Storage > Create bucket: "dokumen-permohonan" (public: false)
-- 2. Buat bucket kedua: "surat-persetujuan" (public: false, akses via signed URL)
