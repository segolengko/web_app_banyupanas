'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Calendar, Download, Printer, Filter, Search, ChevronLeft, ChevronRight, Hash, User, Ticket, CreditCard, Banknote, TrendingDown, RotateCcw, Rows3, CalendarDays } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DailyReportRow, ReportFilters, ReportSummary, ReportTransaction } from '@/types/admin'
import { createReportSearchParams } from '@/utils/report-params'
import { formatCurrency, getPetugasName } from '@/utils/reporting'

type ReportListProps = {
  detailData: ReportTransaction[]
  recapData: DailyReportRow[]
  filters: ReportFilters
  summary: ReportSummary
  totalItems: number
  totalPages: number
}

export default function ReportList({
  detailData,
  recapData,
  filters,
  summary,
  totalItems,
  totalPages,
}: ReportListProps) {
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
        <SummaryCard title="Total Pendapatan" value={formatCurrency(summary.revenue)} icon={<Banknote size={24} />} color="#10B981" />
        <SummaryCard title="Tiket Terjual" value={`${summary.tickets} Tiket`} icon={<Ticket size={24} />} color="#6366F1" />
        <SummaryCard title="Total Diskon" value={`-${formatCurrency(summary.discount).replace('Rp ', 'Rp ')}`} icon={<TrendingDown size={24} />} color="#F87171" isNegative />
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
                  <th style={{ padding: '20px' }}>Diskon</th>
                  <th style={{ padding: '20px' }}>Total Bayar</th>
                  <th className="no-print" style={{ padding: '20px' }}>Metode</th>
                </tr>
              ) : (
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '20px' }}><Calendar size={14} /> Tanggal</th>
                  <th style={{ padding: '20px' }}>Jumlah Transaksi</th>
                  <th style={{ padding: '20px' }}>Tiket</th>
                  <th style={{ padding: '20px' }}>Diskon</th>
                  <th style={{ padding: '20px' }}>Pendapatan</th>
                </tr>
              )}
            </thead>
            <tbody>
              {filters.mode === 'detail'
                ? detailData.map((transaction) => {
                    const petugasName = getPetugasName(transaction)

                    return (
                      <tr key={transaction.id} className="table-row">
                        <td style={{ padding: '20px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {transaction.id.substring(0, 8)}...
                        </td>
                        <td style={{ padding: '20px' }}>
                          {new Date(transaction.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '20px' }}>{petugasName || '-'}</td>
                        <td style={{ padding: '20px', fontWeight: '600' }}>{transaction.total_tiket} Tiket</td>
                        <td style={{ padding: '20px', color: transaction.diskon_nominal > 0 ? '#F87171' : 'var(--text-muted)' }}>
                          {transaction.diskon_nominal > 0 ? `-${formatCurrency(transaction.diskon_nominal)}` : '-'}
                        </td>
                        <td style={{ padding: '20px', color: '#4ade80', fontWeight: '700' }}>
                          {formatCurrency(transaction.total_bayar)}
                        </td>
                        <td className="no-print" style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--primary-color)' }}>
                            {transaction.metode_bayar === 'tunai' ? <Banknote size={14} /> : <CreditCard size={14} />}
                            {transaction.metode_bayar.toUpperCase()}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                : recapData.map((row) => (
                    <tr key={row.dateKey} className="table-row">
                      <td style={{ padding: '20px', fontWeight: '600' }}>{row.label}</td>
                      <td style={{ padding: '20px' }}>{row.transactionCount} Transaksi</td>
                      <td style={{ padding: '20px', fontWeight: '600' }}>{row.tickets} Tiket</td>
                      <td style={{ padding: '20px', color: row.discount > 0 ? '#F87171' : 'var(--text-muted)' }}>
                        {row.discount > 0 ? `-${formatCurrency(row.discount)}` : '-'}
                      </td>
                      <td style={{ padding: '20px', color: '#4ade80', fontWeight: '700' }}>{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
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
        .input-group input:focus {
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

        @media print {
          .no-print { display: none !important; }
          .sidebar { display: none !important; }
          .main-content { margin: 0 !important; padding: 20px !important; width: 100% !important; background: white !important; }
          .glass-panel { border: none !important; background: white !important; box-shadow: none !important; border-radius: 0 !important; }
          body { background: white !important; color: black !important; }
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
