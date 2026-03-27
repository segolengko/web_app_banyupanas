'use client'

import Link from 'next/link'

type PdfToolbarActionsProps = {
  className?: string
}

export default function PdfToolbarActions({ className }: PdfToolbarActionsProps) {
  return (
    <div className={className}>
      <button type="button" onClick={() => window.print()}>
        Cetak / Simpan PDF
      </button>
      <Link href="/laporan">Kembali ke Laporan</Link>
    </div>
  )
}
