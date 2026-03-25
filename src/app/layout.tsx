import type { Metadata } from 'next'
import { Manrope, Sora } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['500', '600', '700', '800'],
})

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
      <body className={`${manrope.variable} ${sora.variable}`}>{children}</body>
    </html>
  )
}
