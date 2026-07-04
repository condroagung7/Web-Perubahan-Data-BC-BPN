import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Dipakai di Server Components, Route Handlers, dan Server Actions.
 * Membaca/menulis cookie sesi lewat next/headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Diabaikan jika dipanggil dari Server Component (tidak bisa set cookie).
            // Middleware yang akan menangani refresh sesi.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — HANYA dipakai di server (API routes) untuk operasi
 * yang butuh bypass RLS, misal admin generate surat & update status.
 * JANGAN PERNAH expose service role key ke client/browser.
 */
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
