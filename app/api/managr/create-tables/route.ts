import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/managr/create-tables
 * Initialize MANAGR database tables (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if tables already exist by querying them
    const { data: teamsCheck } = await supabase
      .from("managr_teams")
      .select("id")
      .limit(1)

    if (teamsCheck !== null) {
      return NextResponse.json({ message: "Tables already exist" }, { status: 200 })
    }

    // Create managr_teams table
    const { error: createTeamsError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS managr_teams (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          musician_address text NOT NULL UNIQUE,
          team_name text,
          is_active boolean DEFAULT true,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          metadata jsonb DEFAULT '{}'
        );

        -- RLS Policies for managr_teams
        ALTER TABLE managr_teams ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Musicians can view own team"
          ON managr_teams FOR SELECT
          USING (musician_address = auth.jwt() ->> 'sub' OR auth.jwt() ->> 'role' = 'service_role');

        CREATE POLICY "Musicians can update own team"
          ON managr_teams FOR UPDATE
          USING (musician_address = auth.jwt() ->> 'sub' OR auth.jwt() ->> 'role' = 'service_role');

        CREATE POLICY "System can create teams"
          ON managr_teams FOR INSERT
          WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR true);
      `,
    })

    if (createTeamsError && !createTeamsError.message.includes("already exists")) {
      throw createTeamsError
    }

    // Create managr_musician_profile table
    const { error: createProfileError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS managr_musician_profile (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          musician_address text NOT NULL UNIQUE,
          team_id uuid REFERENCES managr_teams(id) ON DELETE CASCADE,
          preferred_agents text[] DEFAULT ARRAY[]::text[],
          analytics_enabled boolean DEFAULT true,
          auto_management_enabled boolean DEFAULT true,
          risk_tolerance text DEFAULT 'medium',
          max_total_budget numeric DEFAULT 10000,
          notification_email text,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          metadata jsonb DEFAULT '{}'
        );

        -- RLS Policies for managr_musician_profile
        ALTER TABLE managr_musician_profile ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Musicians can view own profile"
          ON managr_musician_profile FOR SELECT
          USING (musician_address = auth.jwt() ->> 'sub' OR auth.jwt() ->> 'role' = 'service_role');

        CREATE POLICY "Musicians can update own profile"
          ON managr_musician_profile FOR UPDATE
          USING (musician_address = auth.jwt() ->> 'sub' OR auth.jwt() ->> 'role' = 'service_role');

        CREATE POLICY "System can create profiles"
          ON managr_musician_profile FOR INSERT
          WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR true);
      `,
    })

    if (createProfileError && !createProfileError.message.includes("already exists")) {
      throw createProfileError
    }

    return NextResponse.json({
      message: "MANAGR tables created successfully",
      tables: ["managr_teams", "managr_musician_profile"],
    })
  } catch (error: any) {
    console.error("[MANAGR Create Tables] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create tables" }, { status: 500 })
  }
}
