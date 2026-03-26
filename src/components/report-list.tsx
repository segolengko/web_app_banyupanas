'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Download, Printer, Filter, Search, ChevronLeft, ChevronRight, Hash, User, Ticket, CreditCard, Banknote, RotateCcw, Rows3, CalendarDays, Ban, CircleDollarSign, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DailyReportRow, ReportFilters, ReportSummary, ReportTransaction } from '@/types/admin'
import { cancelTransactionAction } from '@/app/laporan/actions'
import { createReportSearchParams } from '@/utils/report-params'
import { formatCurrency, getPetugasName, getTransactionRefund, isCancelledTransaction } from '@/utils/reporting'

type ReportListProps = {
  detailData: ReportTransaction[]
  recapData: DailyReportRow[]
  filters: ReportFilters
  summary: ReportSummary
  totalItems: number
  totalPages: number
  canCancelTransaction: boolean
}

export default function ReportList({
  detailData,
  recapData,
  filters,
  summary,
  totalItems,
  totalPages,
  canCancelTransaction,
}: ReportListProps) {
  const router = useRouter()
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ReportTransaction | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const printReport = () => window.print()

  const exportHref = useMemo(() => {
    const params = createReportSearchParams({
      mode: filters.mode,
      searchTerm: filters.searchTerm,
      startDate: filters.startDate,
      endDate: filters.endDate,
    })

    const query = params.toString()
    return query ? `/laporan/export?${query}` : '/laporan/export'
  }, [filters.endDate, filters.mode, filters.searchTerm, filters.startDate])

  const pageLinks = useMemo(() => {
    if (totalPages <= 1) {
      return [1]
    }

    const start = Math.max(1, filters.page - 2)
    const end = Math.min(totalPages, start + 4)
    const normalizedStart = Math.max(1, end - 4)

    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index)
  }, [filters.page, totalPages])

  const createPageHref = (page: number) => {
    const params = createReportSearchParams({
      ...filters,
      page,
    })

    const query = params.toString()
    return query ? `/laporan?${query}` : '/laporan'
  }

  const createModeHref = (mode: 'detail' | 'rekap') => {
    const params = createReportSearchParams({
      ...filters,
      mode,
      page: 1,
    })

    const query = params.toString()
    return query ? `/laporan?${query}` : '/laporan'
  }

  const visibleCount = filters.mode === 'rekap' ? recapData.length : detailData.length

  const openCancelDialog = (transaction: ReportTransaction) => {
    if (isCancelledTransaction(transaction)) {
      return
    }

    setCancelTarget(transaction)
    setCancelReason('Pengunjung batal masuk dan uang dikembalikan.')
    setCancelError(null)
  }

  const closeCancelDialog = () => {
    if (pendingTransactionId) {
      return
    }

    setCancelTarget(null)
    setCancelReason('')
    setCancelError(null)
  }

  const submitCancelDialog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!cancelTarget) {
      return
    }

    const trimmedReason = cancelReason.trim()

    if (!trimmedReason) {
      setCancelError('Alasan pembatalan wajib diisi.')
      return
    }

    setCancelError(null)
    setPendingTransactionId(cancelTarget.id)

    startTransition(async () => {
      const result = await cancelTransactionAction({
        transactionId: cancelTarget.id,
        cancelReason: trimmedReason,
      })

      setPendingTransactionId(null)

      if (result?.error) {
        setCancelError(result.error)
        return
      }

      closeCancelDialog()
      router.refresh()
    })
  }

  return (
    <>
      <form
        action="/laporan"
        method="get"
        className="no-print glass-panel"
        style={{ padding: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Filter Laporan</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="submit" className="export-btn pdf">
              <Filter size={16} /> Terapkan
            </button>
            <Link href="/laporan" className="export-btn pdf">
              <RotateCcw size={16} /> Reset
            </Link>
            <Link href={exportHref} className="export-btn excel">
              <Download size={16} /> Excel
            </Link>
            <button type="button" onClick={printReport} className="export-btn pdf">
              <Printer size={16} /> Cetak PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <input type="hidden" name="mode" value={filters.mode} />
          <div className="input-group">
            <Search className="input-icon" size={16} />
            <input type="text" name="searchTerm" placeholder="Cari Petugas atau ID..." defaultValue={filters.searchTerm} />
          </div>
          <div className="input-group">
            <Filter className="input-icon" size={16} />
            <select name="status" defaultValue={filters.status}>
              <option value="semua">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
          <div className="input-group">
            <Calendar className="input-icon" size={16} />
            <input type="date" name="startDate" defaultValue={filters.startDate} />
          </div>
          <div className="input-group">
            <Calendar className="input-icon" size={16} />
            <input type="date" name="endDate" defaultValue={filters.endDate} />
          </div>
        </div>
      </form>

      <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link href={createModeHref('detail')} className={`export-btn ${filters.mode === 'detail' ? 'excel' : 'pdf'}`}>
          <Rows3 size={16} /> Laporan Detail
        </Link>
        <Link href={createModeHref('rekap')} className={`export-btn ${filters.mode === 'rekap' ? 'excel' : 'pdf'}`}>
          <CalendarDays size={16} /> Rekap Harian
        </Link>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <SummaryCard title="Pendapatan Tiket Bersih" value={formatCurrency(summary.revenue)} icon={<Banknote size={24} />} color="#10B981" />
        <SummaryCard title="Tiket Valid" value={`${summary.tickets} Tiket`} icon={<Ticket size={24} />} color="#6366F1" />
        <SummaryCard title="Total Diskon" value={formatCurrency(summary.discount)} icon={<CreditCard size={24} />} color="#FB7185" isNegative={summary.discount > 0} />
        <SummaryCard title="Total Refund" value={formatCurrency(summary.refund)} icon={<CircleDollarSign size={24} />} color="#F87171" isNegative={summary.refund > 0} />
        <SummaryCard title="Total Pengeluaran" value={formatCurrency(summary.expenses)} icon={<Wallet size={24} />} color="#F59E0B" isNegative={summary.expenses > 0} />
        <SummaryCard title="Saldo Bersih" value={formatCurrency(summary.netRevenue)} icon={<Banknote size={24} />} color="#22C55E" isNegative={summary.netRevenue < 0} />
        <SummaryCard title="Transaksi Batal" value={`${summary.cancelledCount} Transaksi`} icon={<Ban size={24} />} color="#F59E0B" />
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              {filters.mode === 'detail' ? (
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '20px' }}><Hash size={14} /> ID</th>
                  <th style={{ padding: '20px' }}>Waktu</th>
                  <th style={{ padding: '20px' }}><User size={14} /> Petugas</th>
                  <th style={{ padding: '20px' }}>Jumlah</th>
                  <th style={{ padding: '20px' }}>Status</th>
                  <th style={{ padding: '20px' }}>Diskon</th>
                  <th style={{ padding: '20px' }}>Total Bayar</th>
                  <th style={{ padding: '20px' }}>Refund</th>
                  <th className="no-print" style={{ padding: '20px' }}>Metode</th>
                  <th className="no-print" style={{ padding: '20px' }}>Aksi</th>
                </tr>
              ) : (
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '20px' }}><Calendar size={14} /> Tanggal</th>
                  <th style={{ padding: '20px' }}>Jumlah Transaksi</th>
                  <th style={{ padding: '20px' }}>Dibatalkan</th>
                  <th style={{ padding: '20px' }}>Tiket Valid</th>
                  <th style={{ padding: '20px' }}>Diskon</th>
                  <th style={{ padding: '20px' }}>Refund</th>
                  <th style={{ padding: '20px' }}>Pengeluaran</th>
                  <th style={{ padding: '20px' }}>Saldo Bersih</th>
                </tr>
              )}
            </thead>
            <tbody>
              {filters.mode === 'detail'
                ? detailData.map((transaction) => {
                    const petugasName = getPetugasName(transaction)
                    const cancelled = isCancelledTransaction(transaction)
                    const refundAmount = getTransactionRefund(transaction)

                    return (
                      <tr key={transaction.id} className="table-row">
                        <td style={{ padding: '20px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {transaction.id.substring(0, 8)}...
                        </td>
                        <td style={{ padding: '20px' }}>
                          {new Date(transaction.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '20px' }}>{petugasName || '-'}</td>
                        <td style={{ padding: '20px', fontWeight: '600' }}>{cancelled ? '0 Tiket' : `${transaction.total_tiket} Tiket`}</td>
                        <td style={{ padding: '20px' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: cancelled ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.12)',
                              color: cancelled ? '#FCA5A5' : '#86EFAC',
                            }}
                          >
                            {cancelled ? <Ban size={12} /> : <Ticket size={12} />}
                            {cancelled ? 'DIBATALKAN' : 'SELESAI'}
                          </div>
                        </td>
                        <td style={{ padding: '20px', color: cancelled ? 'var(--text-muted)' : transaction.diskon_nominal > 0 ? '#F87171' : 'var(--text-muted)' }}>
                          {!cancelled && transaction.diskon_nominal > 0 ? `-${formatCurrency(transaction.diskon_nominal)}` : '-'}
                        </td>
                        <td style={{ padding: '20px', color: cancelled ? 'var(--text-muted)' : '#4ade80', fontWeight: '700' }}>
                          {cancelled ? '-' : formatCurrency(transaction.total_bayar)}
                        </td>
                        <td style={{ padding: '20px', color: refundAmount > 0 ? '#FCA5A5' : 'var(--text-muted)', fontWeight: '700' }}>
                          {refundAmount > 0 ? formatCurrency(refundAmount) : '-'}
                        </td>
                        <td className="no-print" style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--primary-color)' }}>
                            {transaction.metode_bayar === 'tunai' ? <Banknote size={14} /> : <CreditCard size={14} />}
                            {transaction.metode_bayar.toUpperCase()}
                          </div>
                        </td>
                        <td className="no-print" style={{ padding: '20px' }}>
                          {cancelled ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Sudah batal
                            </span>
                          ) : canCancelTransaction ? (
                            <button
                              type="button"
                              className="report-cancel-btn"
                              disabled={pendingTransactionId === transaction.id}
                              onClick={() => openCancelDialog(transaction)}
                            >
                              <Ban size={14} />
                              {pendingTransactionId === transaction.id ? 'Memproses...' : 'Batalkan'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Hanya lihat
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                : recapData.map((row) => (
                    <tr key={row.dateKey} className="table-row">
                      <td style={{ padding: '20px', fontWeight: '600' }}>{row.label}</td>
                      <td style={{ padding: '20px' }}>{row.transactionCount} Transaksi</td>
                      <td style={{ padding: '20px', color: row.cancelledCount > 0 ? '#FCA5A5' : 'var(--text-muted)', fontWeight: '700' }}>
                        {row.cancelledCount} Transaksi
                      </td>
                      <td style={{ padding: '20px', fontWeight: '600' }}>{row.tickets} Tiket</td>
                      <td style={{ padding: '20px', color: row.discount > 0 ? '#F87171' : 'var(--text-muted)' }}>
                        {row.discount > 0 ? `-${formatCurrency(row.discount)}` : '-'}
                      </td>
                      <td style={{ padding: '20px', color: row.refund > 0 ? '#FCA5A5' : 'var(--text-muted)', fontWeight: '700' }}>
                        {row.refund > 0 ? formatCurrency(row.refund) : '-'}
                      </td>
                      <td style={{ padding: '20px', color: row.expenses > 0 ? '#FBBF24' : 'var(--text-muted)', fontWeight: '700' }}>
                        {row.expenses > 0 ? formatCurrency(row.expenses) : '-'}
                      </td>
                      <td style={{ padding: '20px', color: row.netRevenue < 0 ? '#F87171' : '#4ade80', fontWeight: '700' }}>{formatCurrency(row.netRevenue)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {filters.mode === 'rekap' && (
          <div className="print-only report-print-receipt">
            <div className="report-receipt-title">Rekap Harian Banyupanas</div>
            <div className="report-receipt-subtitle">
              Periode {filters.startDate || 'Awal'} s.d. {filters.endDate || 'Sekarang'}
            </div>
            <div className="report-receipt-lines">
              <div><span>Transaksi Valid</span><strong>{summary.transactionCount - summary.cancelledCount}</strong></div>
              <div><span>Tiket Valid</span><strong>{summary.tickets}</strong></div>
              <div><span>Pendapatan Tiket</span><strong>{formatCurrency(summary.revenue)}</strong></div>
              <div><span>Total Refund</span><strong>{formatCurrency(summary.refund)}</strong></div>
              <div><span>Total Pengeluaran</span><strong>{formatCurrency(summary.expenses)}</strong></div>
              <div><span>Saldo Bersih</span><strong>{formatCurrency(summary.netRevenue)}</strong></div>
            </div>
          </div>
        )}

        <div className="no-print" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Menampilkan <strong>{visibleCount}</strong> dari <strong>{totalItems}</strong> transaksi
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href={createPageHref(Math.max(1, filters.page - 1))}
              className={`pagination-btn ${filters.page === 1 ? 'disabled' : ''}`}
              aria-disabled={filters.page === 1}
              tabIndex={filters.page === 1 ? -1 : 0}
            >
              <ChevronLeft size={18} />
            </Link>
            <div style={{ display: 'flex', gap: '4px' }}>
              {pageLinks.map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={createPageHref(pageNumber)}
                  className={`pagination-btn ${filters.page === pageNumber ? 'active' : ''}`}
                >
                  {pageNumber}
                </Link>
              ))}
            </div>
            <Link
              href={createPageHref(Math.min(totalPages || 1, filters.page + 1))}
              className={`pagination-btn ${filters.page >= totalPages ? 'disabled' : ''}`}
              aria-disabled={filters.page >= totalPages}
              tabIndex={filters.page >= totalPages ? -1 : 0}
            >
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        {totalItems === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Tidak ada transaksi yang cocok dengan filter Anda.
          </div>
        )}
      </div>

      {cancelTarget && (
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
              <button type="button" className="report-modal-close" onClick={closeCancelDialog} disabled={Boolean(pendingTransactionId)}>
                ×
              </button>
            </div>

            <form onSubmit={submitCancelDialog} className="report-modal-body">
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
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Contoh: pengunjung batal masuk dan meminta uang kembali."
                  rows={4}
                />
              </label>

              <label className="report-modal-field">
                <span>Nominal Refund</span>
                <input
                  type="text"
                  value={formatCurrency(cancelTarget.total_bayar)}
                  readOnly
                  disabled
                />
                <small>Refund otomatis mengikuti total bayar transaksi.</small>
              </label>

              {cancelError && <div className="report-modal-error">{cancelError}</div>}

              <div className="report-modal-actions">
                <button type="button" className="export-btn pdf" onClick={closeCancelDialog} disabled={Boolean(pendingTransactionId)}>
                  Tutup
                </button>
                <button type="submit" className="report-cancel-btn" disabled={Boolean(pendingTransactionId)}>
                  <Ban size={14} />
                  {pendingTransactionId ? 'Menyimpan...' : 'Konfirmasi Batal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-group {
          position: relative;
          flex: 1;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-group input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          transition: all 0.2s;
        }
        .input-group select {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          transition: all 0.2s;
          appearance: none;
        }
        .input-group input:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .input-group select:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .export-btn {
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          text-decoration: none;
          font-family: inherit;
        }
        .export-btn.excel {
          background: #10B981;
          color: white;
        }
        .export-btn.excel:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        .export-btn.pdf {
          background: rgba(255,255,255,0.05);
          color: white;
          border: 1px solid var(--border-color);
        }
        .export-btn.pdf:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }
        .table-row {
          transition: background 0.2s;
          border-top: 1px solid var(--border-color);
        }
        .table-row:hover {
          background: rgba(255,255,255,0.02);
        }
        .pagination-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .pagination-btn:hover:not(.disabled) {
          background: rgba(255,255,255,0.1);
          border-color: var(--primary-color);
        }
        .pagination-btn.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          font-weight: 700;
        }
        .pagination-btn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }
        .report-cancel-btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid rgba(248, 113, 113, 0.35);
          background: rgba(127, 29, 29, 0.3);
          color: #fecaca;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .report-cancel-btn:hover:enabled {
          background: rgba(127, 29, 29, 0.45);
          transform: translateY(-1px);
        }
        .report-cancel-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .report-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 1000;
          backdrop-filter: blur(6px);
        }
        .report-modal {
          width: min(100%, 560px);
          padding: 24px;
          display: grid;
          gap: 20px;
        }
        .report-modal-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        .report-modal-header h3 {
          margin: 0 0 6px;
          font-size: 22px;
        }
        .report-modal-header p {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .report-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: rgba(255,255,255,0.04);
          color: white;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
        }
        .report-modal-body {
          display: grid;
          gap: 18px;
        }
        .report-modal-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .report-modal-summary > div {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          display: grid;
          gap: 6px;
        }
        .report-modal-summary span {
          color: var(--text-muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
        }
        .report-modal-summary strong {
          font-size: 16px;
        }
        .report-modal-field {
          display: grid;
          gap: 8px;
        }
        .report-modal-field span {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-soft);
        }
        .report-modal-field textarea,
        .report-modal-field input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-family: inherit;
        }
        .report-modal-field textarea:focus,
        .report-modal-field input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .report-modal-field small {
          color: var(--text-muted);
          font-size: 12px;
        }
        .report-modal-error {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(127, 29, 29, 0.3);
          border: 1px solid rgba(248, 113, 113, 0.3);
          color: #fecaca;
          font-size: 13px;
          line-height: 1.6;
        }
        .report-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .print-only {
          display: none;
        }
        .report-print-receipt {
          padding: 28px 24px;
          border-top: 1px dashed rgba(0,0,0,0.25);
        }
        .report-receipt-title {
          font-size: 20px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 4px;
        }
        .report-receipt-subtitle {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .report-receipt-lines {
          display: grid;
          gap: 10px;
        }
        .report-receipt-lines > div {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px dashed rgba(255,255,255,0.18);
          padding-bottom: 8px;
          font-size: 14px;
        }

        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .sidebar { display: none !important; }
          .main-content { margin: 0 !important; padding: 20px !important; width: 100% !important; background: white !important; }
          .glass-panel { border: none !important; background: white !important; box-shadow: none !important; border-radius: 0 !important; }
          body { background: white !important; color: black !important; }
          .report-print-receipt { display: block !important; padding: 0 0 18px !important; }
          .report-receipt-subtitle { color: #4b5563 !important; }
          .report-receipt-lines > div { border-bottom: 1px dashed #9ca3af !important; }
          table { display: ${filters.mode === 'rekap' ? 'none' : 'table'} !important; }
          td, th { color: black !important; border-bottom: 1px solid #ddd !important; padding: 12px 8px !important; font-size: 12px !important; }
          th { background: #f9f9f9 !important; }
          .dashboard-container { display: block !important; }
        }
      `}</style>
    </>
  )
}

function SummaryCard({ title, value, icon, color, isNegative = false }: { title: string, value: string, icon: ReactNode, color: string, isNegative?: boolean }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: `2px solid ${color}` }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px', fontWeight: '500' }}>{title}</p>
        <h4 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: isNegative && value !== 'Rp 0' && value !== '-Rp 0' ? '#F87171' : 'white' }}>{value}</h4>
      </div>
    </div>
  )
}
