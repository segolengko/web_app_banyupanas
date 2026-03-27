import Sidebar from '@/components/sidebar'
import CurrencyInput from '@/components/currency-input'
import { checkSupervisorAccess } from '@/utils/supabase/check-admin'
import { createClient } from '@/utils/supabase/server'
import { getEndDateExclusiveIso, getStartDateIso } from '@/utils/report-params'
import { createExpenseAction, deleteExpenseAction, updateExpenseAction } from './actions'
import type { ExpensePaymentMethod } from '@/types/admin'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type ExpenseRow = {
  id: string
  expense_at: string
  nominal: number
  category: string
  description: string | null
  payment_method: ExpensePaymentMethod
}

function formatDateDisplay(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function readValue(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

export default async function PengeluaranPage({ searchParams }: PageProps) {
  const session = await checkSupervisorAccess()
  const supabase = await createClient()
  const canManageExpenses = session.role !== 'supervisor'
  const params = (await searchParams) ?? {}
  const startDate = readValue(params, 'startDate')
  const endDate = readValue(params, 'endDate')
  const category = readValue(params, 'category').trim()
  const editId = readValue(params, 'edit').trim()

  let query = supabase
    .from('operational_expenses')
    .select('id, expense_at, nominal, category, description, payment_method')
    .order('expense_at', { ascending: false })
    .limit(200)

  if (startDate) {
    query = query.gte('expense_at', getStartDateIso(startDate))
  }

  if (endDate) {
    query = query.lt('expense_at', getEndDateExclusiveIso(endDate))
  }

  if (category) {
    query = query.ilike('category', `%${category}%`)
  }

  const { data } = await query
  const expenses = (data ?? []) as ExpenseRow[]
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.nominal || 0), 0)
  const selectedExpense = expenses.find((expense) => expense.id === editId) ?? null
  const defaultExpenseDate = selectedExpense
    ? new Date(selectedExpense.expense_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)
  const formAction = selectedExpense ? updateExpenseAction : createExpenseAction

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Pengeluaran Operasional</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Catat biaya operasional harian yang nantinya dipotong dari pendapatan tiket pada laporan admin.
          </p>
        </header>

        <form
          action="/pengeluaran"
          method="get"
          className="glass-panel"
          style={{ padding: '22px', marginBottom: '28px', display: 'grid', gap: '18px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ fontSize: '17px' }}>Filter Pengeluaran</strong>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-primary" style={{ padding: '12px 18px' }}>Terapkan</button>
              <a
                href="/pengeluaran"
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.04)',
                  fontWeight: 600,
                }}
              >
                Reset
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Tanggal Mulai</label>
              <input type="date" name="startDate" defaultValue={startDate} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Tanggal Akhir</label>
              <input type="date" name="endDate" defaultValue={endDate} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Kategori</label>
              <input type="text" name="category" defaultValue={category} placeholder="Contoh: ATK, konsumsi" />
            </div>
          </div>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>Total Pengeluaran</div>
            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>Rp {totalExpenses.toLocaleString('id-ID')}</div>
          </div>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>Jumlah Catatan</div>
            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{expenses.length.toLocaleString('id-ID')}</div>
          </div>
        </div>

        <div className="expense-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '28px', alignItems: 'start' }}>
          <div className="glass-panel expense-list-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="expense-table-wrap">
            <table className="expense-desktop-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '18px' }}>Tanggal</th>
                  <th style={{ padding: '18px' }}>Kategori</th>
                  <th style={{ padding: '18px' }}>Metode</th>
                  <th style={{ padding: '18px' }}>Keterangan</th>
                  <th style={{ padding: '18px' }}>Nominal</th>
                  <th style={{ padding: '18px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense: ExpenseRow) => (
                  <tr key={expense.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '18px' }}>
                      {formatDateDisplay(expense.expense_at)}
                    </td>
                    <td style={{ padding: '18px', fontWeight: 700 }}>{expense.category}</td>
                    <td style={{ padding: '18px', textTransform: 'uppercase', color: 'var(--text-muted)', fontSize: '13px' }}>{expense.payment_method}</td>
                    <td style={{ padding: '18px', color: 'var(--text-muted)' }}>{expense.description || '-'}</td>
                    <td style={{ padding: '18px', fontWeight: 700, color: '#fbbf24' }}>Rp {expense.nominal.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                        {canManageExpenses ? (
                          <>
                            <a
                              href={`/pengeluaran?${new URLSearchParams({
                                ...(startDate ? { startDate } : {}),
                                ...(endDate ? { endDate } : {}),
                                ...(category ? { category } : {}),
                                edit: expense.id,
                              }).toString()}`}
                              style={{
                                padding: '8px 12px',
                                minWidth: '72px',
                                borderRadius: '10px',
                                border: '1px solid rgba(45, 212, 191, 0.25)',
                                background: 'rgba(45, 212, 191, 0.12)',
                                color: '#99f6e4',
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: 700,
                                textAlign: 'center',
                              }}
                            >
                              Edit
                            </a>
                            <form action={deleteExpenseAction}>
                              <input type="hidden" name="expenseId" value={expense.id} />
                              <button
                                type="submit"
                                style={{
                                  padding: '8px 12px',
                                  minWidth: '72px',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(248, 113, 113, 0.35)',
                                  background: 'rgba(127, 29, 29, 0.3)',
                                  color: '#fecaca',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  fontFamily: 'inherit',
                                  textAlign: 'center',
                                }}
                              >
                                Hapus
                              </button>
                            </form>
                          </>
                        ) : (
                          <span style={{ minWidth: '72px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>
                            Lihat
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Belum ada pengeluaran operasional pada filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            <div className="expense-mobile-list">
              {expenses.map((expense: ExpenseRow) => (
                <article key={expense.id} className="expense-mobile-card">
                  <div className="expense-mobile-card-head">
                    <div>
                      <div className="expense-mobile-date">{formatDateDisplay(expense.expense_at)}</div>
                      <div className="expense-mobile-category">{expense.category}</div>
                    </div>
                    <div className="expense-mobile-amount">Rp {expense.nominal.toLocaleString('id-ID')}</div>
                  </div>

                  <div className="expense-mobile-meta">
                    <span className="expense-mobile-chip">{expense.payment_method.toUpperCase()}</span>
                    <span className="expense-mobile-desc">{expense.description || 'Tanpa keterangan'}</span>
                  </div>

                  <div className="expense-mobile-actions">
                    {canManageExpenses ? (
                      <>
                        <a
                          href={`/pengeluaran?${new URLSearchParams({
                            ...(startDate ? { startDate } : {}),
                            ...(endDate ? { endDate } : {}),
                            ...(category ? { category } : {}),
                            edit: expense.id,
                          }).toString()}`}
                          className="expense-mobile-action expense-mobile-action-edit"
                        >
                          Edit
                        </a>
                        <form action={deleteExpenseAction}>
                          <input type="hidden" name="expenseId" value={expense.id} />
                          <button
                            type="submit"
                            className="expense-mobile-action expense-mobile-action-delete"
                          >
                            Hapus
                          </button>
                        </form>
                      </>
                    ) : (
                      <span className="expense-mobile-view-only">Lihat</span>
                    )}
                  </div>
                </article>
              ))}

              {expenses.length === 0 && (
                <div className="expense-mobile-empty">
                  Belum ada pengeluaran operasional pada filter ini.
                </div>
              )}
            </div>
          </div>

          {canManageExpenses && (
          <div className="glass-panel expense-form-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '18px' }}>{selectedExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h3>
            <form action={formAction} style={{ display: 'grid', gap: '16px' }}>
              {selectedExpense && <input type="hidden" name="expenseId" value={selectedExpense.id} />}
              <div className="input-group">
                <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Tanggal</label>
                <input type="date" name="expenseDate" defaultValue={defaultExpenseDate} required />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Kategori</label>
                <input type="text" name="category" defaultValue={selectedExpense?.category ?? ''} placeholder="Contoh: konsumsi, parkir, BBM" required />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Nominal</label>
                <CurrencyInput
                  name="nominal"
                  defaultValue={selectedExpense?.nominal}
                  placeholder="50.000"
                  required
                />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Metode Pengeluaran</label>
                <select name="paymentMethod" defaultValue={selectedExpense?.payment_method ?? 'tunai'}>
                  <option value="tunai">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>Keterangan</label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={selectedExpense?.description ?? ''}
                  placeholder="Contoh: beli air minum untuk petugas lapangan."
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn-primary" style={{ padding: '14px' }}>
                  {selectedExpense ? 'Update Pengeluaran' : 'Simpan Pengeluaran'}
                </button>
                {selectedExpense && (
                  <a
                    href="/pengeluaran"
                    style={{
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      textDecoration: 'none',
                      background: 'rgba(255,255,255,0.04)',
                      fontWeight: 600,
                    }}
                  >
                    Batal Edit
                  </a>
                )}
              </div>
            </form>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
