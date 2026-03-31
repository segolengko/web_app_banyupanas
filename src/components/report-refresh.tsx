'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'

type ReportRefreshProps = {
  enabled: boolean
  intervalSeconds?: number
}

export default function ReportRefresh({
  enabled,
  intervalSeconds = 90,
}: ReportRefreshProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const runRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  useEffect(() => {
    if (!enabled) {
      return
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        runRefresh()
      }
    }

    const interval = window.setInterval(refreshIfVisible, intervalSeconds * 1000)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [enabled, intervalSeconds])

  return (
    <div
      className="no-print glass-panel"
      style={{
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
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
          Refresh Laporan
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
          {enabled
            ? `Data diperbarui otomatis tiap ${intervalSeconds} detik saat tab aktif.`
            : 'Auto refresh dimatikan saat mode rekap atau pencarian aktif.'}
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
        <RefreshCw size={16} />
        {isPending ? 'Refresh...' : 'Refresh'}
      </button>
    </div>
  )
}
