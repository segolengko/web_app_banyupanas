import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Banyupanas Ticketing Admin',
  description: 'Sistem manajemen tiket Banyupanas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
