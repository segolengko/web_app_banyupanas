'use client'

import { Ban } from 'lucide-react'
import type { FormEvent } from 'react'
import type { ReportTransaction } from '@/types/admin'
import { formatCurrency, getPetugasName } from '@/utils/reporting'

type ReportCancelDialogProps = {
  cancelTarget: ReportTransaction | null
  cancelReason: string
  cancelError: string | null
  pending: boolean
  onClose: () => void
  onReasonChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function ReportCancelDialog({
  cancelTarget,
  cancelReason,
  cancelError,
  pending,
  onClose,
  onReasonChange,
  onSubmit,
}: ReportCancelDialogProps) {
  if (!cancelTarget) {
    return null
  }

  return (
    <div className="report-modal-backdrop no-print">
      <div className="report-modal glass-panel">
        <div className="report-modal-header">
          <div>
            <h3>Batalkan Transaksi</h3>
            <p>
              Transaksi <strong>{cancelTarget.id.substring(0, 8)}...</strong> akan ditandai dibatalkan dan
              nominal refund akan masuk ke laporan.
            </p>
          </div>
          <button type="button" className="report-modal-close" onClick={onClose} disabled={pending}>
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="report-modal-body">
          <div className="report-modal-summary">
            <div>
              <span>Total Bayar</span>
              <strong>{formatCurrency(cancelTarget.total_bayar)}</strong>
            </div>
            <div>
              <span>Petugas</span>
              <strong>{getPetugasName(cancelTarget) || '-'}</strong>
            </div>
          </div>

          <label className="report-modal-field">
            <span>Alasan Pembatalan</span>
            <textarea
              value={cancelReason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Contoh: pengunjung batal masuk dan meminta uang kembali."
              rows={4}
            />
          </label>

          <label className="report-modal-field">
            <span>Nominal Refund</span>
            <input type="text" value={formatCurrency(cancelTarget.total_bayar)} readOnly disabled />
            <small>Refund otomatis mengikuti total bayar transaksi.</small>
          </label>

          {cancelError && <div className="report-modal-error">{cancelError}</div>}

          <div className="report-modal-actions">
            <button type="button" className="export-btn pdf" onClick={onClose} disabled={pending}>
              Tutup
            </button>
            <button type="submit" className="report-cancel-btn" disabled={pending}>
              <Ban size={14} />
              {pending ? 'Menyimpan...' : 'Konfirmasi Batal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
