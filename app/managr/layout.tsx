import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MANAGR - Artist-Owned Label Stack | MyUSIC",
  description: "MANAGR coordinates autonomous music agents that help artists create, release, promote, and earn without giving up ownership. The next label is yours.",
  openGraph: {
    title: "MANAGR - The Artist-Owned Label Stack",
    description: "Autonomous music agents for artists. Create. Own. Earn.",
    type: "website",
  },
}

export default function ManagRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
