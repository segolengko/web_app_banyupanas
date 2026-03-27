'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { BackofficeRole } from '@/utils/supabase/check-admin'
import { navLinks } from './navigation-config'

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
      {navLinks.filter((link) => link.roles.includes(role)).map((link) => {
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
