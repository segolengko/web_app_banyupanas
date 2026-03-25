'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppWindow, LayoutDashboard, Ticket, Users, Wallet } from 'lucide-react'

const links = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/petugas',
    label: 'Manajemen Petugas',
    icon: Users,
  },
  {
    href: '/tickets',
    label: 'Harga Tiket',
    icon: Ticket,
  },
  {
    href: '/profile-wisata',
    label: 'Profil Wisata',
    icon: Wallet,
  },
  {
    href: '/laporan',
    label: 'Laporan Transaksi',
    icon: AppWindow,
  },
]

export default function SidebarNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {links.map((link) => {
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${isActive(link.href, link.exact) ? 'active' : ''}`}
          >
            <Icon size={20} />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
