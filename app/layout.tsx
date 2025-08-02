import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
// Tracking is now handled via the TrackingProvider in the Providers component
import { ConfigCheck } from '@/components/config-check'
import { Providers } from '@/components/providers/Providers'

export const metadata: Metadata = {
  title: 'CBMS - Customer Behaviour Monitoring System',
  description: 'Intelligent customer behaviour monitoring system for tracking, analyzing, and reporting user interactions',
  generator: 'CBMS',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Providers>
          <ConfigCheck />
          {children}
        </Providers>
      </body>
    </html>
  )
}