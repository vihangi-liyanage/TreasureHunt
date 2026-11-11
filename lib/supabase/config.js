const REQUIRED_PUBLIC_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

export function hasSupabaseConfig() {
  return REQUIRED_PUBLIC_KEYS.every((key) => Boolean(process.env[key]));
}

export function getSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured. Add the public project URL and publishable key to .env.local.");
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getSupabaseAdminConfig() {
  const config = getSupabaseConfig();
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase server mutations are not configured. Add SUPABASE_SECRET_KEY to .env.local.");
  }
  return { ...config, secretKey: process.env.SUPABASE_SECRET_KEY };
}
