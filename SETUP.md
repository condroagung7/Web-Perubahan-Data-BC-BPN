# Website Permohonan Perubahan Data

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres) + Resend + Gemini AI**

## Struktur Proyek

```
src/
├── app/
│   ├── (public)/
│   │   ├── permohonan/page.tsx     # Form pengajuan publik
│   │   └── status/page.tsx         # Cek status via kode tracking
│   ├── (admin)/admin/
│   │   ├── login/page.tsx          # Login admin (Supabase Auth)
│   │   └── dashboard/page.tsx      # List & approve/reject permohonan
│   ├── api/
│   │   ├── permohonan/route.ts     # POST submit, GET cek status
│   │   ├── admin/approve/route.ts  # Approve + generate surat .docx + email
│   │   ├── admin/reject/route.ts   # Reject + email notifikasi
│   │   └── chat/route.ts           # Chat widget (Gemini)
│   └── page.tsx                    # Landing page
├── components/
│   ├── admin/DashboardTable.tsx
│   └── chat/ChatWidget.tsx
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── email/resend.ts
│   ├── docx/generate-surat.ts
│   └── validations/permohonan.ts
└── types/database.ts

supabase/migrations/001_init.sql   # Jalankan ini di Supabase SQL Editor
middleware.ts                      # Proteksi route /admin
```

## Langkah Setup

### 1. Buat Project Supabase
1. Daftar di [supabase.com](https://supabase.com) → New Project.
2. Buka **SQL Editor** → jalankan isi file `supabase/migrations/001_init.sql`.
3. Buka **Storage** → buat 2 bucket:
   - `dokumen-permohonan` (private)
   - `surat-persetujuan` (private)
4. Buka **Authentication > Users** → buat 1 akun admin manual (email + password), ini yang dipakai login ke `/admin/login`.
5. Salin `Project URL`, `anon public key`, dan `service_role key` dari **Project Settings > API**.

### 2. Setup Resend (Email)
1. Daftar di [resend.com](https://resend.com), verifikasi domain pengirim (atau pakai domain test mereka untuk development).
2. Ambil API Key dari dashboard.
3. Pastikan alamat instansi (`bcbalikpapan@kemenkeu.go.id`) sudah benar di `.env`.

> Catatan: Resend mensyaratkan domain pengirim terverifikasi untuk kirim ke alamat selain milik akun sendiri. Untuk uji coba awal, gunakan domain sandbox Resend lalu ganti ke domain resmi sebelum production.

### 3. Setup Gemini API
1. Buat API Key di [Google AI Studio](https://aistudio.google.com/apikey).
2. Masukkan ke `GEMINI_API_KEY`.

### 4. Konfigurasi Environment
```bash
cp .env.local.example .env.local
```
Isi semua variabel sesuai kredensial di atas.

### 5. Install & Jalankan Lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:3000`.

### 6. Uji Alur
1. Isi form di `/permohonan` → cek tabel `permohonan` di Supabase terisi, dan email masuk ke instansi.
2. Login admin di `/admin/login` → buka `/admin/dashboard` → klik **Setujui** pada salah satu permohonan.
3. Cek: status berubah, surat `.docx` muncul di Storage bucket `surat-persetujuan`, dan email surat terkirim ke pemohon.
4. Cek status permohonan publik di `/status` pakai kode tracking.
5. Coba chat widget AI di pojok kanan bawah.

## Deploy ke Vercel

1. Push project ini ke repository GitHub.
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repo tersebut.
3. Saat konfigurasi, masukkan semua environment variables yang sama seperti `.env.local` (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `EMAIL_TUJUAN_INSTANSI`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (isi dengan URL Vercel setelah deploy pertama, lalu redeploy)
4. Klik **Deploy**.
5. Setelah live, buka Supabase **Authentication > URL Configuration** dan tambahkan domain Vercel ke **Redirect URLs** supaya login admin berjalan normal.

## Pengembangan Lanjutan (opsional)
- Tambah upload dokumen pendukung ke bucket `dokumen-permohonan` dari form publik.
- Tambah role-based access (admin biasa vs supervisor) di tabel terpisah.
- Tambah pagination & filter status di dashboard admin.
- Tambah rate-limiting di endpoint `/api/permohonan` untuk mencegah spam submit.
