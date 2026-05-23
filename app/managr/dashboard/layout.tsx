import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MANAGR Dashboard - Agent Management | MyUSIC",
  description: "Monitor and manage all your autonomous music agents in one place",
}

export default function ManagRDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
