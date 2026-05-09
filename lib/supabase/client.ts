import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a dummy client during build/SSG to avoid crashing
    // This will only be called on the client side at runtime where env vars are available
    return {} as any
  }

  return createBrowserClient(url, key)
}
