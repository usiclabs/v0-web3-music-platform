import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DeveloperPortal } from '@/components/developer-portal'

async function getDeveloperData(userAddress: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Fetch developer's agents
  const { data: agents } = await supabase
    .from('agents')
    .select(`
      *,
      agent_reputation (
        reputation_score,
        average_rating,
        total_feedback_count
      )
    `)
    .eq('owner_address', userAddress)
    .order('created_at', { ascending: false })

  // Fetch builder codes
  const { data: builderCodes } = await supabase
    .from('builder_codes')
    .select('*')
    .eq('owner_address', userAddress)
    .order('total_earnings', { ascending: false })

  // Fetch agent earnings
  const { data: earnings } = await supabase
    .from('agent_earnings')
    .select('*')
    .in(
      'agent_address',
      agents?.map(a => a.agent_address) || []
    )
    .order('created_at', { ascending: false })
    .limit(50)

  return {
    agents: agents || [],
    builderCodes: builderCodes || [],
    earnings: earnings || [],
  }
}

export default async function DevelopersPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const data = await getDeveloperData(session.user.id)

  return (
    <main className="min-h-screen bg-background">
      <DeveloperPortal {...data} userAddress={session.user.id} />
    </main>
  )
}
