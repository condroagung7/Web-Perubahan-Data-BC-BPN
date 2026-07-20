const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY;

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Add it to .env.local for local development and to your hosting provider's Environment Variables.`
    );
  }

  return value;
}

export function getSupabaseUrl() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
}

export function getSupabaseAnonKey() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey);
}

export function getSupabaseServiceRoleKey() {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey);
}