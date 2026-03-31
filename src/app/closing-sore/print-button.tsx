'use client'

import Link from 'next/link'

type PrintButtonProps = {
  href: string
  label?: string
}

export default function PrintButton({ href, label = 'Cetak PDF' }: PrintButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="btn-primary no-print"
      style={{ padding: '12px 18px' }}
    >
      {label}
    </Link>
  )
}
