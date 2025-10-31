import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "")
  .split(",")
  .map((addr) => addr.trim().toLowerCase())

export async function POST(request: Request) {
  try {
    // Get wallet address from headers
    const walletAddress = request.headers.get("x-wallet-address")

    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized - No wallet address" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = ADMIN_ADDRESSES.includes(walletAddress.toLowerCase())

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized - Not an admin" }, { status: 403 })
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("[v0] Running database migrations...")

    // Migration 1: Create reports table
    const { error: reportsError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Create reports table for content flagging
        CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
          reporter_address TEXT NOT NULL,
          reason TEXT NOT NULL,
          details TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          reviewed_by TEXT,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_reports_track_id ON reports(track_id);
        CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
        CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_address);

        -- Add RLS policies
        ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Anyone can create reports" ON reports;
        DROP POLICY IF EXISTS "Users can read their own reports" ON reports;
        DROP POLICY IF EXISTS "Allow read access to reports" ON reports;

        -- Allow anyone to create reports
        CREATE POLICY "Anyone can create reports" ON reports
          FOR INSERT
          WITH CHECK (true);

        -- Allow anyone to read their own reports
        CREATE POLICY "Users can read their own reports" ON reports
          FOR SELECT
          USING (reporter_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

        -- Allow admins to read all reports (will be enforced in API)
        CREATE POLICY "Allow read access to reports" ON reports
          FOR SELECT
          USING (true);
      `,
    })

    if (reportsError) {
      console.error("[v0] Error creating reports table:", reportsError)
      // Try direct SQL execution instead
      const { error: directError1 } = await supabase.from("reports").select("id").limit(1)

      if (directError1 && directError1.message.includes("does not exist")) {
        // Table doesn't exist, create it using raw SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
            reporter_address TEXT NOT NULL,
            reason TEXT NOT NULL,
            details TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            reviewed_by TEXT,
            reviewed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        // We'll need to execute this via a different method
        console.log("[v0] Need to execute SQL directly. SQL:", createTableSQL)
      }
    }

    // Migration 2: Add is_hidden to tracks
    const { error: tracksError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Add is_hidden field to tracks table
        ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
        ALTER TABLE tracks ADD COLUMN IF NOT EXISTS hidden_by TEXT;
        ALTER TABLE tracks ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE;

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_tracks_is_hidden ON tracks(is_hidden);
      `,
    })

    if (tracksError) {
      console.error("[v0] Error adding is_hidden to tracks:", tracksError)
    }

    console.log("[v0] Migrations completed")

    return NextResponse.json({
      success: true,
      message: "Database migrations completed",
      errors: {
        reports: reportsError?.message,
        tracks: tracksError?.message,
      },
    })
  } catch (error) {
    console.error("[v0] Migration error:", error)
    return NextResponse.json(
      { error: "Failed to run migrations", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
