import { checkSupervisorAccess } from '@/utils/supabase/check-admin'
import PrintTrigger from '@/app/laporan/pdf/print-trigger'
import PdfToolbarActions from '../pdf-toolbar-actions'
import styles from './page.module.css'
import { formatDateDisplay, getClosingSummaryData } from '../closing-data'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readValue(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export default async function ClosingSorePdfPage({ searchParams }: PageProps) {
  await checkSupervisorAccess()

  const params = (await searchParams) ?? {}
  const closingDate = readValue(params, 'date') || new Date().toISOString().slice(0, 10)
  const notes = readValue(params, 'notes')
  const summary = await getClosingSummaryData(closingDate)

  return (
    <main className={styles.page}>
      <PrintTrigger />

      <div className={`${styles.toolbar} no-print`}>
        <div>
          <strong>Dokumen Closing Sore Banyupanas</strong>
          <p>Halaman ini khusus untuk cetak atau simpan PDF closing sore.</p>
        </div>
        <PdfToolbarActions className={styles.toolbarActions} />
      </div>

      <article className={styles.document}>
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.eyebrow}>Banyupanas Ticketing</div>
            <h1>Laporan Closing Sore</h1>
            <p>Dokumen rekap operasional harian yang merangkum transaksi tiket, diskon, refund, pengeluaran, dan saldo bersih.</p>
          </div>
          <div className={styles.meta}>
            <div className={styles.metaRow}>
              <span>Tanggal Closing</span>
              <strong>{formatDateDisplay(closingDate)}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Status Dokumen</span>
              <strong>Closing Harian</strong>
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
            <span>Total Transaksi</span>
            <strong>{summary.totalTransactions.toLocaleString('id-ID')}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Tiket Valid</span>
            <strong>{summary.totalTickets.toLocaleString('id-ID')}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Pendapatan Tiket</span>
            <strong>{formatCurrency(summary.grossRevenue)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Diskon</span>
            <strong>{formatCurrency(summary.totalDiscount)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Refund</span>
            <strong>{formatCurrency(summary.totalRefund)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Pengeluaran</span>
            <strong>{formatCurrency(summary.totalExpenses)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Saldo Bersih</span>
            <strong>{formatCurrency(summary.netRevenue)}</strong>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Ringkasan Closing</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Komponen</th>
                <th>Nilai</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Transaksi</td>
                <td>{summary.totalTransactions.toLocaleString('id-ID')}</td>
                <td>Jumlah transaksi yang tercatat pada tanggal closing.</td>
              </tr>
              <tr>
                <td>Total Tiket Valid</td>
                <td>{summary.totalTickets.toLocaleString('id-ID')}</td>
                <td>Jumlah tiket valid setelah pembatalan diperhitungkan.</td>
              </tr>
              <tr>
                <td>Pendapatan Tiket</td>
                <td>{formatCurrency(summary.grossRevenue)}</td>
                <td>Nilai pendapatan tiket bersih dari transaksi valid.</td>
              </tr>
              <tr>
                <td>Total Diskon</td>
                <td>{formatCurrency(summary.totalDiscount)}</td>
                <td>Akumulasi diskon yang diberikan pada tanggal closing.</td>
              </tr>
              <tr>
                <td>Total Refund</td>
                <td>{formatCurrency(summary.totalRefund)}</td>
                <td>Akumulasi pengembalian uang untuk transaksi yang dibatalkan.</td>
              </tr>
              <tr>
                <td>Total Pengeluaran</td>
                <td>{formatCurrency(summary.totalExpenses)}</td>
                <td>Pengeluaran operasional yang dicatat admin pada tanggal yang sama.</td>
              </tr>
              <tr>
                <td>Saldo Bersih</td>
                <td>{formatCurrency(summary.netRevenue)}</td>
                <td>Pendapatan tiket dikurangi total pengeluaran operasional.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.noteBox}>
          <div className={styles.noteTitle}>Catatan Closing</div>
          <div>{notes || 'Tidak ada catatan tambahan untuk closing ini.'}</div>
        </section>

        <section className={styles.signatureGrid}>
          <div className={styles.signatureBox}>
            <div className={styles.signatureLabel}>Disusun Oleh</div>
            <div className={styles.signatureLine}>Admin Operasional</div>
          </div>
          <div className={styles.signatureBox}>
            <div className={styles.signatureLabel}>Diverifikasi Oleh</div>
            <div className={styles.signatureLine}>Supervisor / Penanggung Jawab</div>
          </div>
        </section>
      </article>
    </main>
  )
}
