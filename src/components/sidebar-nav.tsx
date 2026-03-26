'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppWindow, LayoutDashboard, ReceiptText, Ticket, Users, Wallet } from 'lucide-react'
import type { BackofficeRole } from '@/utils/supabase/check-admin'

const links = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    roles: ['super_admin', 'admin', 'supervisor'],
  },
  {
    href: '/users',
    label: 'Manajemen User',
    icon: Users,
    roles: ['super_admin'],
  },
  {
    href: '/tickets',
    label: 'Harga Tiket',
    icon: Ticket,
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/profile-wisata',
    label: 'Profil Wisata',
    icon: Wallet,
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/laporan',
    label: 'Laporan Transaksi',
    icon: AppWindow,
    roles: ['super_admin', 'admin', 'supervisor'],
  },
  {
    href: '/pengeluaran',
    label: 'Pengeluaran',
    icon: ReceiptText,
    roles: ['super_admin', 'admin', 'supervisor'],
  },
  {
    href: '/closing-sore',
    label: 'Closing Sore',
    icon: ReceiptText,
    roles: ['super_admin', 'admin', 'supervisor'],
  },
]

type SidebarNavProps = {
  role: BackofficeRole
}

export default function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {links.filter((link) => link.roles.includes(role)).map((link) => {
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
