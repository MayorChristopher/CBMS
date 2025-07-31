import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import '../lib/tracking' // Initialize tracking service
import { ConfigCheck } from '@/components/config-check'

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
    <html lang="en">
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
        <ConfigCheck />
        {children}
      </body>
    </html>
  )
}