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

### 3. Setup AI API
1. Buat API Key provider AI yang digunakan aplikasi.
2. Masukkan ke `GROQ_API_KEY`.

> Catatan: kode aplikasi saat ini memakai `GROQ_API_KEY` pada endpoint `/api/chat`, jadi jangan gunakan nama env lama `GEMINI_API_KEY` saat deploy.

### 4. Setup Cloudflare Turnstile (CAPTCHA)
1. Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Turnstile** → **Add widget**.
2. Tambahkan hostname domain production aplikasi dan `localhost` untuk pengembangan lokal.
3. Salin credential widget ke `.env.local`:
   ```bash
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=site-key-dari-cloudflare
   TURNSTILE_SECRET_KEY=secret-key-dari-cloudflare
   ```
4. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` digunakan browser untuk menampilkan widget, sedangkan `TURNSTILE_SECRET_KEY` hanya digunakan endpoint server `/api/permohonan`. Jangan pernah mengekspos secret key ke client atau repository.
5. Setelah mengubah environment variable, restart server development. Token Turnstile berlaku singkat dan hanya dapat dipakai untuk satu submit.

### 5. Konfigurasi Environment
```bash
cp .env.local.example .env.local
```
Isi semua variabel sesuai kredensial di atas, termasuk dua variabel Turnstile pada langkah sebelumnya.

### 6. Install & Jalankan Lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:3000`.

### 7. Uji Alur
1. Buka `/permohonan` → selesaikan CAPTCHA Cloudflare Turnstile → isi dan kirim formulir. Request tanpa token atau dengan token kedaluwarsa harus ditolak.
2. Setelah CAPTCHA valid, cek tabel `permohonan` di Supabase terisi, dan email masuk ke instansi.
3. Login admin di `/admin/login` → buka `/admin/dashboard` → klik **Setujui** pada salah satu permohonan.
4. Cek: status berubah, surat `.docx` muncul di Storage bucket `surat-persetujuan`, dan email surat terkirim ke pemohon.
5. Cek status permohonan publik di `/status` pakai kode tracking.
6. Coba chat widget AI di pojok kanan bawah.

## Deploy ke Vercel

1. Push project ini ke repository GitHub.
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repo tersebut.
3. Saat konfigurasi, masukkan environment variables berikut di **Settings → Environment Variables**:

   ### Wajib
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `EMAIL_TUJUAN_INSTANSI`
   - `ADMIN_EMAILS`
   - `GROQ_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`

   ### Opsional / fallback
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `VERCEL_URL`
   - `SUPABASE_STORAGE_LIMIT_MB` (default `1024`)

4. Nilai penting yang harus diperhatikan:
   - `ADMIN_EMAILS` berisi daftar email admin dipisahkan koma.
   - `NEXT_PUBLIC_APP_URL` harus diisi full URL production, misalnya `https://nama-project.vercel.app`.
   - `CRON_SECRET` wajib diisi agar endpoint cron cleanup tidak bisa dipanggil sembarang pihak.
   - `EMAIL_FROM` harus memakai sender/domain yang valid di Resend.
   - `SUPABASE_SERVICE_ROLE_KEY` dan `TURNSTILE_SECRET_KEY` hanya disimpan di server-side env, jangan pernah dipublikasikan.
   - Daftarkan domain deployment Vercel pada hostname widget di Cloudflare Turnstile. Tambahkan juga `localhost` agar CAPTCHA berfungsi saat development.

5. Klik **Deploy**.
6. Setelah live, buka Supabase **Authentication > URL Configuration** lalu tambahkan:
   - domain Vercel ke **Site URL**
   - URL login/callback yang diperlukan ke **Redirect URLs**
7. Pastikan Vercel Cron aktif untuk path `/api/admin/cleanup-expired-permohonan` sesuai `vercel.json`.
8. Setiap perubahan ke branch `main` / `master` atau pull request akan menjalankan GitHub Actions CI dari file `.github/workflows/ci.yml` untuk:
   - install dependency
   - lint
   - production build

   CI ini membantu memastikan deploy ke Vercel tidak gagal karena error TypeScript, lint, atau build.

## Pengembangan Lanjutan (opsional)
- Tambah upload dokumen pendukung ke bucket `dokumen-permohonan` dari form publik.
- Tambah role-based access (admin biasa vs supervisor) di tabel terpisah.
- Tambah pagination & filter status di dashboard admin.
- Tambah rate-limiting di endpoint `/api/permohonan` untuk mencegah spam submit.
