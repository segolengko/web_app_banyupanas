'use client'

export default function PrintButton() {
  return (
    <button
      type="button"
      className="btn-primary no-print"
      style={{ padding: '12px 18px' }}
      onClick={() => window.print()}
    >
      Cetak PDF
    </button>
  )
}
