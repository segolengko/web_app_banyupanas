import Sidebar from '@/components/sidebar'
import { checkSupervisorAccess } from '@/utils/supabase/check-admin'
import { createClient } from '@/utils/supabase/server'
import { getEndDateExclusiveIso, getStartDateIso } from '@/utils/report-params'
import PrintButton from './print-button'
import { saveClosingAction } from './actions'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type ReportSummaryRpcRow = {
  revenue: number | string
  tickets: number | string
  discount: number | string
  refund: number | string
  cancelled_count: number | string
  transaction_count: number | string
}

type ExpenseSummaryRpcRow = {
  expenses: number | string
  expense_count: number | string
}

type ClosingRow = {
  id: string
  closing_date: string
  total_transactions: number
  total_tickets: number
  gross_revenue: number
  total_discount: number
  total_refund: number
  total_expenses: number
  net_revenue: number
  notes: string | null
  closed_at: string
}

function readValue(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

function asFirstItem<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null
  }

  if (value && typeof value === 'object') {
    return value as T
  }

  return null
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function formatDateDisplay(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default async function ClosingSorePage({ searchParams }: PageProps) {
  const session = await checkSupervisorAccess()
  const supabase = await createClient()
  const canManageClosing = session.role !== 'supervisor'
  const params = (await searchParams) ?? {}
  const closingDate = readValue(params, 'date') || new Date().toISOString().slice(0, 10)
  const notes = readValue(params, 'notes')

  const summaryRpcParams = {
    p_start: getStartDateIso(closingDate),
    p_end: getEndDateExclusiveIso(closingDate),
    p_status: null,
    p_search: null,
  }

  const expenseRpcParams = {
    p_start: getStartDateIso(closingDate),
    p_end: getEndDateExclusiveIso(closingDate),
  }

  const { data: transactionSummaryData } = await supabase
    .rpc('report_transaction_summary', summaryRpcParams)
    .returns<ReportSummaryRpcRow>()

  const { data: expenseSummaryData } = await supabase
    .rpc('report_expense_summary', expenseRpcParams)
    .returns<ExpenseSummaryRpcRow>()

  const transactionSummary = asFirstItem<ReportSummaryRpcRow>(transactionSummaryData)
  const expenseSummary = asFirstItem<ExpenseSummaryRpcRow>(expenseSummaryData)

  const grossRevenue = toNumber(transactionSummary?.revenue)
  const totalTickets = toNumber(transactionSummary?.tickets)
  const totalDiscount = toNumber(transactionSummary?.discount)
  const totalRefund = toNumber(transactionSummary?.refund)
  const totalTransactions = toNumber(transactionSummary?.transaction_count)
  const totalExpenses = toNumber(expenseSummary?.expenses)
  const netRevenue = grossRevenue - totalExpenses

  const { data: closingHistoryData } = await supabase
    .from('cash_closings')
    .select('id, closing_date, total_transactions, total_tickets, gross_revenue, total_discount, total_refund, total_expenses, net_revenue, notes, closed_at')
    .order('closing_date', { ascending: false })
    .limit(30)

  const closingHistory = (closingHistoryData ?? []) as ClosingRow[]

  return (
    <div className="dashboard-container closing-print-container">
      <Sidebar />

      <main className="main-content closing-print-page">
        <header className="no-print" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Closing Sore</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Rekap penjualan harian admin: pendapatan tiket dikurangi pengeluaran operasional, siap dicetak sebagai receipt PDF.
            </p>
          </div>
          <PrintButton />
        </header>

        <form method="get" action="/closing-sore" className="glass-panel no-print" style={{ padding: '22px', marginBottom: '24px', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) auto', gap: '16px', alignItems: 'end' }}>
            <div className="input-group">
              <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Tanggal Closing</label>
              <input type="date" name="date" defaultValue={closingDate} required />
            </div>
            <div>
              <button type="submit" className="btn-primary" style={{ padding: '14px 18px' }}>Muat Rekap</button>
            </div>
          </div>
        </form>

        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
          <StatCard title="Transaksi" value={totalTransactions.toLocaleString('id-ID')} />
          <StatCard title="Tiket Valid" value={totalTickets.toLocaleString('id-ID')} />
          <StatCard title="Pengeluaran" value={`Rp ${totalExpenses.toLocaleString('id-ID')}`} tone="warn" />
          <StatCard title="Saldo Bersih" value={`Rp ${netRevenue.toLocaleString('id-ID')}`} tone={netRevenue < 0 ? 'danger' : 'success'} />
        </div>

        <div className="closing-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '28px', alignItems: 'start' }}>
          <div className="glass-panel no-print closing-history-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0 }}>Riwayat Closing</h3>
            </div>
            <div className="closing-table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '18px' }}>Tanggal</th>
                    <th style={{ padding: '18px' }}>Transaksi</th>
                    <th style={{ padding: '18px' }}>Tiket</th>
                    <th style={{ padding: '18px' }}>Pendapatan</th>
                    <th style={{ padding: '18px' }}>Pengeluaran</th>
                    <th style={{ padding: '18px' }}>Saldo Bersih</th>
                    <th style={{ padding: '18px' }}>Ditutup</th>
                  </tr>
                </thead>
                <tbody>
                  {closingHistory.map((closing) => {
                    const closedAt = new Date(closing.closed_at)

                    return (
                      <tr key={closing.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '18px' }}>{formatDateDisplay(closing.closing_date)}</td>
                        <td style={{ padding: '18px' }}>{closing.total_transactions.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '18px' }}>{closing.total_tickets.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '18px' }}>Rp {closing.gross_revenue.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '18px' }}>Rp {closing.total_expenses.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '18px', fontWeight: 700, color: closing.net_revenue < 0 ? '#f87171' : '#4ade80' }}>
                          Rp {closing.net_revenue.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '18px' }}>
                          <div style={{ display: 'grid', gap: '2px' }}>
                            <span>{formatDateDisplay(closing.closed_at)}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {closedAt.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} WIB
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {closingHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada snapshot closing yang tersimpan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="closing-mobile-list">
              {closingHistory.length > 0 ? (
                closingHistory.map((closing) => {
                  const closedAt = new Date(closing.closed_at)

                  return (
                    <article key={closing.id} className="closing-mobile-card">
                      <div className="closing-mobile-card-head">
                        <div>
                          <div className="closing-mobile-date">{formatDateDisplay(closing.closing_date)}</div>
                          <div className="closing-mobile-subtitle">
                            Ditutup {formatDateDisplay(closing.closed_at)}{' '}
                            {closedAt.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} WIB
                          </div>
                        </div>
                        <div className={`closing-mobile-amount ${closing.net_revenue < 0 ? 'danger' : 'success'}`}>
                          Rp {closing.net_revenue.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="closing-mobile-grid">
                        <div>
                          <span>Transaksi</span>
                          <strong>{closing.total_transactions.toLocaleString('id-ID')}</strong>
                        </div>
                        <div>
                          <span>Tiket</span>
                          <strong>{closing.total_tickets.toLocaleString('id-ID')}</strong>
                        </div>
                        <div>
                          <span>Pendapatan</span>
                          <strong>Rp {closing.gross_revenue.toLocaleString('id-ID')}</strong>
                        </div>
                        <div>
                          <span>Pengeluaran</span>
                          <strong>Rp {closing.total_expenses.toLocaleString('id-ID')}</strong>
                        </div>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div className="closing-mobile-empty">
                  Belum ada snapshot closing yang tersimpan.
                </div>
              )}
            </div>
          </div>

          <div className="closing-side-panel" style={{ display: 'grid', gap: '20px' }}>
            <section className="glass-panel receipt-print-shell" style={{ padding: '24px' }}>
              <div className="receipt-paper">
                <div className="receipt-center">
                  <div className="receipt-eyebrow">Closing Sore</div>
                  <h2 style={{ margin: '6px 0 0', fontSize: '24px' }}>Banyupanas</h2>
                  <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>Tanggal: {formatDateDisplay(closingDate)}</p>
                </div>

                <div className="receipt-divider" />

                <div className="receipt-block">
                  <ClosingLine label="Total Transaksi" value={String(totalTransactions)} />
                  <ClosingLine label="Tiket Valid" value={String(totalTickets)} />
                  <ClosingLine label="Pendapatan Tiket" value={`Rp ${grossRevenue.toLocaleString('id-ID')}`} />
                  <ClosingLine label="Total Diskon" value={`Rp ${totalDiscount.toLocaleString('id-ID')}`} />
                  <ClosingLine label="Total Refund" value={`Rp ${totalRefund.toLocaleString('id-ID')}`} />
                  <ClosingLine label="Total Pengeluaran" value={`Rp ${totalExpenses.toLocaleString('id-ID')}`} />
                  <ClosingLine label="Saldo Bersih" value={`Rp ${netRevenue.toLocaleString('id-ID')}`} strong />
                </div>

                {notes && (
                  <>
                    <div className="receipt-divider" />
                    <div className="receipt-note">
                      <div className="receipt-note-label">Catatan</div>
                      <div>{notes}</div>
                    </div>
                  </>
                )}

                <div className="receipt-divider" />
                <div className="receipt-center" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Dicetak dari dashboard admin
                </div>
              </div>
            </section>

            {canManageClosing && (
            <section className="glass-panel no-print" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '18px' }}>Simpan Snapshot Closing</h3>
              <form action={saveClosingAction} style={{ display: 'grid', gap: '16px' }}>
                <input type="hidden" name="closingDate" value={closingDate} />
                <input type="hidden" name="totalTransactions" value={String(totalTransactions)} />
                <input type="hidden" name="totalTickets" value={String(totalTickets)} />
                <input type="hidden" name="grossRevenue" value={String(grossRevenue)} />
                <input type="hidden" name="totalDiscount" value={String(totalDiscount)} />
                <input type="hidden" name="totalRefund" value={String(totalRefund)} />
                <input type="hidden" name="totalExpenses" value={String(totalExpenses)} />
                <input type="hidden" name="netRevenue" value={String(netRevenue)} />

                <div className="input-group">
                  <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Catatan Closing</label>
                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={notes}
                    placeholder="Contoh: closing selesai diverifikasi admin dan siap dilaporkan."
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '14px 18px' }}>Simpan Closing</button>
                  <PrintButton />
                </div>
              </form>
            </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function ClosingLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="receipt-line">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <strong style={{ fontSize: strong ? '17px' : '14px' }}>{value}</strong>
    </div>
  )
}

function StatCard({ title, value, tone = 'default' }: { title: string; value: string; tone?: 'default' | 'success' | 'warn' | 'danger' }) {
  const color = tone === 'success'
    ? '#4ade80'
    : tone === 'warn'
      ? '#fbbf24'
      : tone === 'danger'
        ? '#f87171'
        : 'white'

  return (
    <div className="glass-panel" style={{ padding: '22px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color }}>{value}</div>
    </div>
  )
}
