import { checkSupervisorAccess } from '@/utils/supabase/check-admin'
import { parseReportFilters } from '@/utils/report-params'
import { getReportPageData } from '../report-data'
import { formatCurrency, getPetugasName, getTransactionRefund, isCancelledTransaction } from '@/utils/reporting'
import PrintTrigger from './print-trigger'
import styles from './page.module.css'
import PdfToolbarActions from './pdf-toolbar-actions'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ReportPdfPage({ searchParams }: PageProps) {
  await checkSupervisorAccess()

  const filters = parseReportFilters((await searchParams) ?? {})
  const { transactions, recapRows, summary, totalItems } = await getReportPageData(filters, {
    forceAllRows: true,
    pageSize: 5000,
  })

  const periodText = filters.startDate || filters.endDate
    ? `${filters.startDate || 'Awal'} s.d. ${filters.endDate || 'Sekarang'}`
    : 'Semua Periode'

  const isDetail = filters.mode === 'detail'

  return (
    <main className={styles.page}>
      <PrintTrigger />

      <div className={`${styles.toolbar} no-print`}>
        <div>
          <strong>Dokumen Laporan Banyupanas</strong>
          <p>Halaman ini khusus untuk cetak atau simpan PDF.</p>
        </div>
        <PdfToolbarActions className={styles.toolbarActions} />
      </div>

      <article className={styles.document}>
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.eyebrow}>Banyupanas Ticketing</div>
            <h1>{isDetail ? 'Laporan Detail Transaksi' : 'Laporan Rekap Harian'}</h1>
            <p>Dokumen laporan operasional berbasis data transaksi dan pengeluaran.</p>
          </div>
          <div className={styles.meta}>
            <div className={styles.metaRow}>
              <span>Periode</span>
              <strong>{periodText}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Status</span>
              <strong>{filters.status === 'semua' ? 'Semua Status' : filters.status.toUpperCase()}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Pencarian</span>
              <strong>{filters.searchTerm || '-'}</strong>
            </div>
            <div className={styles.metaRow}>
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
        </header>

        <section className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Pendapatan Tiket Bersih</span>
            <strong>{formatCurrency(summary.revenue)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Tiket Valid</span>
            <strong>{summary.tickets} Tiket</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Diskon</span>
            <strong>{formatCurrency(summary.discount)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Refund</span>
            <strong>{formatCurrency(summary.refund)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Pengeluaran</span>
            <strong>{formatCurrency(summary.expenses)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Saldo Bersih</span>
            <strong>{formatCurrency(summary.netRevenue)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Jumlah Data</span>
            <strong>{totalItems}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Transaksi Batal</span>
            <strong>{summary.cancelledCount}</strong>
          </div>
        </section>

        {isDetail ? (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Detail Transaksi</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Petugas</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Diskon</th>
                  <th>Total Bayar</th>
                  <th>Refund</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => {
                    const cancelled = isCancelledTransaction(transaction)
                    const refundAmount = getTransactionRefund(transaction)

                    return (
                      <tr key={transaction.id}>
                        <td>{formatDateTime(transaction.created_at)}</td>
                        <td>{getPetugasName(transaction) || '-'}</td>
                        <td>{cancelled ? '0 Tiket' : `${transaction.total_tiket} Tiket`}</td>
                        <td>{cancelled ? 'Dibatalkan' : 'Selesai'}</td>
                        <td>
                          {!cancelled && transaction.diskon_nominal > 0
                            ? `-${formatCurrency(transaction.diskon_nominal)}`
                            : '-'}
                        </td>
                        <td>{cancelled ? '-' : formatCurrency(transaction.total_bayar)}</td>
                        <td>{refundAmount > 0 ? formatCurrency(refundAmount) : '-'}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.empty}>Tidak ada data transaksi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        ) : (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Rekap Harian</div>
            <table className={styles.table}>
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
                {recapRows.length > 0 ? (
                  recapRows.map((row) => (
                    <tr key={row.dateKey}>
                      <td>{row.label}</td>
                      <td>{row.transactionCount}</td>
                      <td>{row.cancelledCount}</td>
                      <td>{row.tickets}</td>
                      <td>{row.discount > 0 ? `-${formatCurrency(row.discount)}` : '-'}</td>
                      <td>{row.refund > 0 ? formatCurrency(row.refund) : '-'}</td>
                      <td>{row.expenses > 0 ? formatCurrency(row.expenses) : '-'}</td>
                      <td>{formatCurrency(row.netRevenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className={styles.empty}>Tidak ada data rekap.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </article>
    </main>
  )
}
