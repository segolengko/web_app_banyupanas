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

  const pdfHref = useMemo(() => {
    const params = createReportSearchParams({
      mode: filters.mode,
      searchTerm: filters.searchTerm,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
    })

    const query = params.toString()
    return query ? `/laporan/pdf?${query}` : '/laporan/pdf'
  }, [filters.endDate, filters.mode, filters.searchTerm, filters.startDate, filters.status])

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

  const getJakartaDateKey = (value: string | Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(typeof value === 'string' ? new Date(value) : value)

  const canCancelTransactionToday = (transaction: ReportTransaction) =>
    getJakartaDateKey(transaction.created_at) === getJakartaDateKey(new Date())

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
            <Link href={pdfHref} target="_blank" rel="noreferrer" className="export-btn pdf">
              <Printer size={16} /> Cetak PDF
            </Link>
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
        <div className="report-table-wrap" style={{ overflowX: 'auto' }}>
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
                    const canCancelByDate = canCancelTransactionToday(transaction)

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
                          ) : canCancelTransaction && canCancelByDate ? (
                            <button
                              type="button"
                              className="report-cancel-btn"
                              disabled={pendingTransactionId === transaction.id}
                              onClick={() => openCancelDialog(transaction)}
                            >
                              <Ban size={14} />
                              {pendingTransactionId === transaction.id ? 'Memproses...' : 'Batalkan'}
                            </button>
                          ) : !canCancelByDate ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Lewat tanggal
                            </span>
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

        <div className="report-mobile-list no-print">
          {filters.mode === 'detail' ? (
            detailData.length > 0 ? (
              detailData.map((transaction) => {
                const petugasName = getPetugasName(transaction)
                const cancelled = isCancelledTransaction(transaction)
                const refundAmount = getTransactionRefund(transaction)
                const canCancelByDate = canCancelTransactionToday(transaction)

                return (
                  <article key={transaction.id} className="report-mobile-card">
                    <div className="report-mobile-card-head">
                      <div>
                        <div className="report-mobile-id">
                          ID {transaction.id.substring(0, 8)}...
                        </div>
                        <div className="report-mobile-time">
                          {new Date(transaction.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div
                        className={`report-mobile-status ${cancelled ? 'cancelled' : 'done'}`}
                      >
                        {cancelled ? 'DIBATALKAN' : 'SELESAI'}
                      </div>
                    </div>

                    <div className="report-mobile-grid">
                      <div>
                        <span>Petugas</span>
                        <strong>{petugasName || '-'}</strong>
                      </div>
                      <div>
                        <span>Jumlah</span>
                        <strong>{cancelled ? '0 Tiket' : `${transaction.total_tiket} Tiket`}</strong>
                      </div>
                      <div>
                        <span>Diskon</span>
                        <strong>
                          {!cancelled && transaction.diskon_nominal > 0
                            ? `-${formatCurrency(transaction.diskon_nominal)}`
                            : '-'}
                        </strong>
                      </div>
                      <div>
                        <span>Total Bayar</span>
                        <strong>{cancelled ? '-' : formatCurrency(transaction.total_bayar)}</strong>
                      </div>
                      <div>
                        <span>Refund</span>
                        <strong>{refundAmount > 0 ? formatCurrency(refundAmount) : '-'}</strong>
                      </div>
                      <div>
                        <span>Metode</span>
                        <strong>{transaction.metode_bayar.toUpperCase()}</strong>
                      </div>
                    </div>

                    <div className="report-mobile-actions">
                      {cancelled ? (
                        <span className="report-mobile-muted">Sudah batal</span>
                      ) : canCancelTransaction && canCancelByDate ? (
                        <button
                          type="button"
                          className="report-cancel-btn"
                          disabled={pendingTransactionId === transaction.id}
                          onClick={() => openCancelDialog(transaction)}
                        >
                          <Ban size={14} />
                          {pendingTransactionId === transaction.id ? 'Memproses...' : 'Batalkan'}
                        </button>
                      ) : !canCancelByDate ? (
                        <span className="report-mobile-muted">Lewat tanggal</span>
                      ) : (
                        <span className="report-mobile-muted">Hanya lihat</span>
                      )}
                    </div>
                  </article>
                )
              })
            ) : null
          ) : recapData.length > 0 ? (
            recapData.map((row) => (
              <article key={row.dateKey} className="report-mobile-card">
                <div className="report-mobile-card-head">
                  <div>
                    <div className="report-mobile-id">Tanggal</div>
                    <div className="report-mobile-time">{row.label}</div>
                  </div>
                  <div className="report-mobile-status done">
                    {row.transactionCount} Transaksi
                  </div>
                </div>

                <div className="report-mobile-grid">
                  <div>
                    <span>Dibatalkan</span>
                    <strong>{row.cancelledCount} Transaksi</strong>
                  </div>
                  <div>
                    <span>Tiket Valid</span>
                    <strong>{row.tickets} Tiket</strong>
                  </div>
                  <div>
                    <span>Diskon</span>
                    <strong>{row.discount > 0 ? `-${formatCurrency(row.discount)}` : '-'}</strong>
                  </div>
                  <div>
                    <span>Refund</span>
                    <strong>{row.refund > 0 ? formatCurrency(row.refund) : '-'}</strong>
                  </div>
                  <div>
                    <span>Pengeluaran</span>
                    <strong>{row.expenses > 0 ? formatCurrency(row.expenses) : '-'}</strong>
                  </div>
                  <div>
                    <span>Saldo Bersih</span>
                    <strong>{formatCurrency(row.netRevenue)}</strong>
                  </div>
                </div>
              </article>
            ))
          ) : null}
        </div>

        <div className="print-only report-print-document">
          <div className="report-print-header">
            <div className="report-print-title">Laporan Transaksi Banyupanas</div>
            <div className="report-print-subtitle">
              {filters.mode === 'detail' ? 'Laporan Detail' : 'Rekap Harian'}
            </div>
            <div className="report-print-meta-list">
              <div className="report-print-meta-row">
                <span>Periode</span>
                <strong>{filters.startDate || 'Awal'} s.d. {filters.endDate || 'Sekarang'}</strong>
              </div>
              <div className="report-print-meta-row">
                <span>Status</span>
                <strong>{filters.status === 'semua' ? 'Semua Status' : filters.status.toUpperCase()}</strong>
              </div>
              <div className="report-print-meta-row">
                <span>Pencarian</span>
                <strong>{filters.searchTerm || '-'}</strong>
              </div>
              <div className="report-print-meta-row">
                <span>Dicetak</span>
                <strong>
                  {new Date().toLocaleString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </div>
            </div>
          </div>

          <div className="report-print-summary-list">
            <div className="report-print-summary-row">
              <span>Pendapatan Tiket Bersih</span>
              <strong>{formatCurrency(summary.revenue)}</strong>
            </div>
            <div className="report-print-summary-row">
              <span>Tiket Valid</span>
              <strong>{summary.tickets} Tiket</strong>
            </div>
            <div className="report-print-summary-row">
              <span>Total Diskon</span>
              <strong>{formatCurrency(summary.discount)}</strong>
            </div>
            <div className="report-print-summary-row">
              <span>Total Refund</span>
              <strong>{formatCurrency(summary.refund)}</strong>
            </div>
            <div className="report-print-summary-row">
              <span>Total Pengeluaran</span>
              <strong>{formatCurrency(summary.expenses)}</strong>
            </div>
            <div className="report-print-summary-row">
              <span>Saldo Bersih</span>
              <strong>{formatCurrency(summary.netRevenue)}</strong>
            </div>
          </div>

          {filters.mode === 'detail' ? (
            <div className="report-print-entry-list">
              {detailData.map((transaction) => {
                const petugasName = getPetugasName(transaction)
                const cancelled = isCancelledTransaction(transaction)
                const refundAmount = getTransactionRefund(transaction)

                return (
                  <section key={transaction.id} className="report-print-entry">
                    <div className="report-print-entry-head">
                      <div>
                        <div className="report-print-entry-id">ID {transaction.id.substring(0, 8)}...</div>
                        <div className="report-print-entry-time">
                          {new Date(transaction.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className={`report-print-entry-status ${cancelled ? 'cancelled' : 'done'}`}>
                        {cancelled ? 'DIBATALKAN' : 'SELESAI'}
                      </div>
                    </div>

                    <div className="report-print-entry-grid">
                      <div className="report-print-entry-row">
                        <span>Petugas</span>
                        <strong>{petugasName || '-'}</strong>
                      </div>
                      <div className="report-print-entry-row">
                        <span>Jumlah</span>
                        <strong>{cancelled ? '0 Tiket' : `${transaction.total_tiket} Tiket`}</strong>
                      </div>
                      <div className="report-print-entry-row">
                        <span>Metode</span>
                        <strong>{transaction.metode_bayar.toUpperCase()}</strong>
                      </div>
                      <div className="report-print-entry-row">
                        <span>Diskon</span>
                        <strong>
                          {!cancelled && transaction.diskon_nominal > 0
                            ? `-${formatCurrency(transaction.diskon_nominal)}`
                            : '-'}
                        </strong>
                      </div>
                      <div className="report-print-entry-row">
                        <span>Total Bayar</span>
                        <strong>{cancelled ? '-' : formatCurrency(transaction.total_bayar)}</strong>
                      </div>
                      <div className="report-print-entry-row">
                        <span>Refund</span>
                        <strong>{refundAmount > 0 ? formatCurrency(refundAmount) : '-'}</strong>
                      </div>
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            <div className="report-print-table-wrap">
              <table className="report-print-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Transaksi</th>
                    <th>Dibatalkan</th>
                    <th>Tiket Valid</th>
                    <th>Diskon</th>
                    <th>Refund</th>
                    <th>Pengeluaran</th>
                    <th>Saldo Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {recapData.map((row) => (
                    <tr key={row.dateKey}>
                      <td>{row.label}</td>
                      <td>{row.transactionCount} Transaksi</td>
                      <td>{row.cancelledCount} Transaksi</td>
                      <td>{row.tickets} Tiket</td>
                      <td>{row.discount > 0 ? `-${formatCurrency(row.discount)}` : '-'}</td>
                      <td>{row.refund > 0 ? formatCurrency(row.refund) : '-'}</td>
                      <td>{row.expenses > 0 ? formatCurrency(row.expenses) : '-'}</td>
                      <td>{formatCurrency(row.netRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
        .report-mobile-list {
          display: none;
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
        .report-print-document {
          display: none;
          padding: 28px 24px 32px;
          color: #111827;
          background: white;
        }
        .report-print-header {
          display: block;
          margin-bottom: 18px;
        }
        .report-print-title {
          font-size: 24px;
          font-weight: 800;
          text-align: center;
        }
        .report-print-subtitle {
          text-align: center;
          font-size: 14px;
          color: #4b5563;
          font-weight: 700;
          margin-top: 4px;
        }
        .report-print-meta-list {
          display: block;
          margin-top: 16px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          overflow: hidden;
        }
        .report-print-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .report-print-meta-row:last-child {
          border-bottom: none;
        }
        .report-print-meta-row span,
        .report-print-summary-row span,
        .report-print-entry-row span {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
          font-weight: 700;
        }
        .report-print-meta-row strong,
        .report-print-summary-row strong,
        .report-print-entry-row strong {
          font-size: 13px;
          color: #111827;
          text-align: right;
        }
        .report-print-summary-list {
          display: block;
          margin-bottom: 18px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          overflow: hidden;
        }
        .report-print-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .report-print-summary-row:last-child {
          border-bottom: none;
        }
        .report-print-entry-list {
          display: grid;
          gap: 12px;
        }
        .report-print-entry {
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 12px;
          background: #ffffff;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .report-print-entry-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          padding-bottom: 10px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .report-print-entry-id {
          font-size: 12px;
          font-weight: 800;
          color: #111827;
        }
        .report-print-entry-time {
          margin-top: 4px;
          font-size: 11px;
          color: #4b5563;
          line-height: 1.5;
        }
        .report-print-entry-status {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          white-space: nowrap;
          border: 1px solid #d1d5db;
        }
        .report-print-entry-status.done {
          background: #ecfdf5;
          color: #166534;
          border-color: #bbf7d0;
        }
        .report-print-entry-status.cancelled {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .report-print-entry-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 14px;
        }
        .report-print-entry-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 6px;
          border-bottom: 1px dashed #e5e7eb;
        }
        .report-print-table-wrap {
          border: 1px solid #d1d5db;
          border-radius: 12px;
          overflow: hidden;
        }
        .report-print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          table-layout: fixed;
        }
        .report-print-table th,
        .report-print-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          vertical-align: top;
          word-break: break-word;
        }
        .report-print-table thead th {
          background: #f3f4f6;
          color: #111827;
          font-weight: 800;
        }
        .report-print-table tbody tr:last-child td {
          border-bottom: none;
        }

        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .sidebar { display: none !important; }
          .main-content { margin: 0 !important; padding: 20px !important; width: 100% !important; background: white !important; }
          .glass-panel { border: none !important; background: white !important; box-shadow: none !important; border-radius: 0 !important; }
          body { background: white !important; color: black !important; }
          .report-print-document { display: block !important; padding: 0 !important; }
          .report-print-meta-list,
          .report-print-summary-list,
          .report-print-entry,
          .report-print-table-wrap { border-color: #d1d5db !important; }
          .report-print-table th,
          .report-print-table td { color: #111827 !important; }
          .report-print-entry-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .dashboard-container { display: block !important; }
        }

        @media (max-width: 640px) {
          .report-table-wrap {
            display: none;
          }
          .report-mobile-list {
            display: grid;
            gap: 12px;
            padding: 14px;
          }
          .report-mobile-card {
            display: grid;
            gap: 14px;
            padding: 16px;
            border-radius: 18px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
          }
          .report-mobile-card-head {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
          }
          .report-mobile-id {
            font-size: 12px;
            font-weight: 700;
            color: var(--text-muted);
          }
          .report-mobile-time {
            margin-top: 4px;
            font-size: 14px;
            font-weight: 700;
            color: white;
            line-height: 1.5;
          }
          .report-mobile-status {
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
          }
          .report-mobile-status.done {
            background: rgba(74,222,128,0.12);
            color: #86EFAC;
          }
          .report-mobile-status.cancelled {
            background: rgba(248,113,113,0.15);
            color: #FCA5A5;
          }
          .report-mobile-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .report-mobile-grid div {
            display: grid;
            gap: 4px;
          }
          .report-mobile-grid span {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            font-weight: 700;
          }
          .report-mobile-grid strong {
            font-size: 13px;
            line-height: 1.45;
            color: white;
          }
          .report-mobile-actions {
            display: flex;
            justify-content: flex-end;
          }
          .report-mobile-muted {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 700;
          }
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
