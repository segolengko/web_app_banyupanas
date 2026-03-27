'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, MoreHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { BackofficeRole } from '@/utils/supabase/check-admin'
import { navLinks } from './navigation-config'

type MobileBottomNavProps = {
  role: BackofficeRole
  signOutAction: () => Promise<void>
}

export default function MobileBottomNav({ role, signOutAction }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const availableLinks = useMemo(
    () => navLinks.filter((link) => link.roles.includes(role)),
    [role],
  )

  const primaryLinks = useMemo(() => {
    const dashboard = availableLinks.find((link) => link.href === '/')
    const laporan = availableLinks.find((link) => link.href === '/laporan')
    const pengeluaran = availableLinks.find((link) => link.href === '/pengeluaran')
    return [dashboard, laporan, pengeluaran].filter(Boolean)
  }, [availableLinks])

  const secondaryLinks = availableLinks.filter(
    (link) => !primaryLinks.some((primary) => primary?.href === link.href),
  )

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const hasActiveSecondary = secondaryLinks.some((link) =>
    isActive(link.href, link.exact),
  )

  return (
    <>
      {isMoreOpen && (
        <>
          <button
            type="button"
            className="mobile-nav-overlay"
            onClick={() => setIsMoreOpen(false)}
            aria-label="Tutup menu"
          />
          <div className="glass-panel mobile-more-sheet">
            <div className="mobile-more-sheet-header">
              <div>
                <div className="mobile-more-sheet-label">Menu Lainnya</div>
                <div className="mobile-more-sheet-title">Navigasi tambahan</div>
              </div>
              <button
                type="button"
                className="mobile-more-close"
                onClick={() => setIsMoreOpen(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-more-links">
              {secondaryLinks.map((link) => {
                const Icon = link.icon

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`mobile-more-link ${isActive(link.href, link.exact) ? 'active' : ''}`}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                )
              })}

              <form action={signOutAction}>
                <button type="submit" className="mobile-more-link mobile-more-logout">
                  <LogOut size={18} />
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      <nav className="mobile-bottom-nav">
        {primaryLinks.map((link) => {
          if (!link) return null
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-bottom-nav-link ${isActive(link.href, link.exact) ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          )
        })}

        {secondaryLinks.length > 0 && (
          <button
            type="button"
            className={`mobile-bottom-nav-link ${hasActiveSecondary || isMoreOpen ? 'active' : ''}`}
            onClick={() => setIsMoreOpen((current) => !current)}
          >
            <MoreHorizontal size={18} />
            <span>Lainnya</span>
          </button>
        )}
      </nav>
    </>
  )
}
