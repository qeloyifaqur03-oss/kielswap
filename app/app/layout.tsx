import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { DevConsoleSilencer } from '@/components/DevConsoleSilencer'
import './globals.css'

export const metadata: Metadata = {
  title: 'kielswap',
  description: 'Cross-chain token swapping',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-white antialiased">
        <DevConsoleSilencer />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
