import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "./env";

/**
 * Dipakai di Server Components, Route Handlers, dan Server Actions.
 * Membaca/menulis cookie sesi lewat next/headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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
  });
}

/**
 * Service-role client — HANYA dipakai di server (API routes) untuk operasi
 * yang butuh bypass RLS, misal admin generate surat & update status.
 * JANGAN PERNAH expose service role key ke client/browser.
 */
export function createServiceRoleClient() {
  return createSupabaseJsClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
