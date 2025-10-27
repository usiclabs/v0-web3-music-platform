import { createClient } from "@supabase/supabase-js"

// Admin client with service role key - bypasses RLS
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
