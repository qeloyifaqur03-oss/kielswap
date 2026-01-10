/**
 * Layout for /access page - no header/footer
 * This page is standalone and should not have app navigation
 * Background is already provided by root layout (app/layout.tsx)
 */
import NewYearAnimation from '@/components/NewYearAnimation'

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative z-10 min-h-screen">
      <NewYearAnimation />
      {children}
    </main>
  )
}

