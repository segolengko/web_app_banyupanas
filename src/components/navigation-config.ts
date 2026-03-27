import {
  AppWindow,
  LayoutDashboard,
  ReceiptText,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react'
import type { BackofficeRole } from '@/utils/supabase/check-admin'

export type NavLinkConfig = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
  roles: BackofficeRole[]
}

export const navLinks: NavLinkConfig[] = [
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
    label: 'Laporan',
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
