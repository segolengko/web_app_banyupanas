'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'

type DashboardRefreshProps = {
  intervalSeconds?: number
}

export default function DashboardRefresh({
  intervalSeconds = 90,
}: DashboardRefreshProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const runRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        runRefresh()
      }
    }

    const interval = window.setInterval(
      refreshIfVisible,
      intervalSeconds * 1000,
    )

    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [intervalSeconds])

  return (
    <div
      className="glass-panel"
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'grid', gap: '4px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Refresh Dashboard
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
          Data diperbarui otomatis tiap {intervalSeconds} detik saat tab aktif.
        </div>
      </div>

      <button
        type="button"
        className="nav-link"
        onClick={runRefresh}
        disabled={isPending}
        style={{
          minWidth: '120px',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
        {isPending ? 'Refresh...' : 'Refresh'}
      </button>
    </div>
  )
}
