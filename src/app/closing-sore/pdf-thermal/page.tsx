import { checkSupervisorAccess } from '@/utils/supabase/check-admin'
import PrintTrigger from '@/app/laporan/pdf/print-trigger'
import PdfToolbarActions from '../pdf-toolbar-actions'
import styles from './page.module.css'
import { formatDateDisplay, getClosingSummaryData } from '../closing-data'
import { formatJakartaDateTime, getJakartaTodayDate } from '@/utils/jakarta-time'

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

export default async function ClosingSoreThermalPdfPage({ searchParams }: PageProps) {
  await checkSupervisorAccess()

  const params = (await searchParams) ?? {}
  const closingDate = readValue(params, 'date') || getJakartaTodayDate()
  const notes = readValue(params, 'notes')
  const summary = await getClosingSummaryData(closingDate)

  return (
    <main className={styles.page}>
      <PrintTrigger />

      <div className={`${styles.toolbar} no-print`}>
        <div>
          <strong>Thermal PDF Closing Sore</strong>
          <p>Versi ringkas untuk printer Bluetooth thermal 80mm.</p>
        </div>
        <PdfToolbarActions className={styles.toolbarActions} />
      </div>

      <article className={styles.document}>
        <div className={styles.center}>
          <div className={styles.eyebrow}>Banyupanas Ticketing</div>
          <div className={styles.title}>BANYUPANAS</div>
          <p className={styles.subtitle}>Closing Sore</p>
        </div>

        <div className={styles.divider} />

        <div className={styles.metaRow}>
          <span>Tanggal</span>
          <strong>{formatDateDisplay(closingDate)}</strong>
        </div>
        <div className={styles.metaRow}>
          <span>Dicetak</span>
          <strong>
            {formatJakartaDateTime(new Date())}
          </strong>
        </div>

        <div className={styles.divider} />

        <div className={styles.line}>
          <span>Transaksi</span>
          <strong>{summary.totalTransactions.toLocaleString('id-ID')}</strong>
        </div>
        <div className={styles.line}>
          <span>Tiket Valid</span>
          <strong>{summary.totalTickets.toLocaleString('id-ID')}</strong>
        </div>
        <div className={styles.line}>
          <span>Pendapatan</span>
          <strong>{formatCurrency(summary.grossRevenue)}</strong>
        </div>
        <div className={styles.line}>
          <span>Diskon</span>
          <strong>{formatCurrency(summary.totalDiscount)}</strong>
        </div>
        <div className={styles.line}>
          <span>Refund</span>
          <strong>{formatCurrency(summary.totalRefund)}</strong>
        </div>
        <div className={styles.line}>
          <span>Pengeluaran</span>
          <strong>{formatCurrency(summary.totalExpenses)}</strong>
        </div>

        <div className={styles.divider} />

        <div className={styles.line}>
          <span>Saldo Bersih</span>
          <strong className={styles.lineStrong}>{formatCurrency(summary.netRevenue)}</strong>
        </div>

        {notes ? (
          <>
            <div className={styles.divider} />
            <div className={styles.noteBlock}>
              <div className={styles.noteTitle}>Catatan</div>
              <div className={styles.noteText}>{notes}</div>
            </div>
          </>
        ) : null}
      </article>
    </main>
  )
}
