import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/server'
import type { DailyReportRow, ReportFilters, ReportSummary, ReportTransaction } from '@/types/admin'
import { getEndDateExclusiveIso, getStartDateIso, parseReportFilters } from '@/utils/report-params'
import { getPetugasName } from '@/utils/reporting'
import { hasAllowedRole, SUPERVISOR_ROLES } from '@/utils/supabase/check-admin'
import { formatJakartaDateFromKey, formatJakartaDateTime, getJakartaDateKey, getJakartaTodayDate } from '@/utils/jakarta-time'

function applyNumberFormat(
  worksheet: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  columns: number[]
) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (const column of columns) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: column })
      const cell = worksheet[cellRef]

      if (cell && typeof cell.v === 'number') {
        cell.z = '#,##0'
      }
    }
  }
}

function applyWorksheetLayout(
  worksheet: XLSX.WorkSheet,
  headerRowIndex: number,
  lastDataRowIndex: number,
  lastColumnIndex: number
) {
  worksheet['!rows'] = [
    { hpt: 26 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 10 },
    { hpt: 22 },
  ]

  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIndex, c: 0 },
      e: { r: Math.max(headerRowIndex, lastDataRowIndex), c: lastColumnIndex },
    }),
  }
}

async function validateAdmin(requestUrl: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      denied: NextResponse.redirect(new URL('/login', requestUrl)),
    }
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('role, is_active')
    .eq('id', user.id)
    .single<{ role: string; is_active: boolean }>()

  if (!profile || !hasAllowedRole(profile.role, SUPERVISOR_ROLES)) {
    await supabase.auth.signOut()
    return {
      supabase,
      denied: NextResponse.redirect(new URL('/login?message=Akses Ditolak: Dashboard ini hanya untuk Supervisor, Admin, atau Super Admin.', requestUrl)),
    }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return {
      supabase,
      denied: NextResponse.redirect(new URL('/login?message=Akun admin Anda sedang nonaktif. Silakan hubungi pengelola sistem.', requestUrl)),
    }
  }

  return {
    supabase,
    denied: null,
  }
}

type ReportTransactionRpcRow = {
  id: string
  created_at: string
  total_bayar: number | string
  total_tiket: number | string
  diskon_nominal: number | string
  metode_bayar: string
  status_transaksi: 'selesai' | 'dibatalkan'
  refund_nominal: number | string
  cancel_reason: string | null
  cancelled_at: string | null
  petugas_nama_lengkap: string | null
  total_items: number | string
}

type DailyReportRpcRow = {
  date_key: string
  transaction_count: number | string
  cancelled_count: number | string
  tickets: number | string
  discount: number | string
  refund: number | string
  revenue: number | string
  expenses?: number | string
  net_revenue?: number | string
  total_items: number | string
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

type DailyExpenseRpcRow = {
  date_key: string
  expenses: number | string
}

type TransactionDetailRow = {
  transaksi_id: string
  jumlah_tiket: number | string
  kategori_tiket: {
    nama_kategori: string | null
  } | {
    nama_kategori: string | null
  }[] | null
}
const EXPORT_ROW_LIMIT = 100000

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
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


function resolveCategoryName(detail: TransactionDetailRow) {
  if (Array.isArray(detail.kategori_tiket)) {
    return detail.kategori_tiket[0]?.nama_kategori ?? null
  }

  if (detail.kategori_tiket && typeof detail.kategori_tiket === 'object') {
    return detail.kategori_tiket.nama_kategori ?? null
  }

  return null
}

function formatCategoryBreakdown(items?: { categoryName: string; quantity: number }[]) {
  if (!items || items.length === 0) {
    return '-'
  }

  return items.map((item) => `${item.categoryName}: ${item.quantity}`).join('\n')
}

async function attachRecapCategoryBreakdown(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recapRows: DailyReportRow[],
  filters: ReportFilters
) {
  if (recapRows.length === 0) {
    return recapRows
  }

  try {
    const visibleDateKeys = Array.from(new Set(recapRows.map((row) => row.dateKey))).sort()
    const startIso = getStartDateIso(visibleDateKeys[0])
    const endIso = getEndDateExclusiveIso(visibleDateKeys[visibleDateKeys.length - 1])
    const { data: visibleTransactions, error: visibleTransactionsError } = await supabase
      .rpc('report_filtered_transactions', {
        p_start: startIso,
        p_end: endIso,
        p_status: filters.status === 'semua' ? null : filters.status,
        p_search: filters.searchTerm.trim() || null,
        p_page: 1,
        p_page_size: 5000,
      })
      .returns<ReportTransactionRpcRow[]>()

    if (visibleTransactionsError) {
      console.error('Gagal memuat transaksi untuk breakdown export rekap:', visibleTransactionsError.message)
      return recapRows
    }

    const normalizedVisibleTransactions = asArray<ReportTransactionRpcRow>(visibleTransactions)
    if (normalizedVisibleTransactions.length === 0) {
      return recapRows
    }

    const transactionIds = normalizedVisibleTransactions.map((transaction) => transaction.id)
    const transactionDateMap = new Map(
      normalizedVisibleTransactions.map((transaction) => [transaction.id, getJakartaDateKey(transaction.created_at)])
    )

    const { data: detailRows, error: detailError } = await supabase
      .from('transaksi_detail')
      .select('transaksi_id,jumlah_tiket,kategori_tiket(nama_kategori)')
      .in('transaksi_id', transactionIds)

    if (detailError) {
      console.error('Gagal memuat detail kategori tiket export rekap:', detailError.message)
      return recapRows
    }

    const groupedByDate = new Map<string, Map<string, number>>()

    for (const detail of asArray<TransactionDetailRow>(detailRows)) {
      const dateKey = transactionDateMap.get(detail.transaksi_id)
      if (!dateKey) {
        continue
      }

      const categoryName = resolveCategoryName(detail) ?? 'Kategori tiket'
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, new Map())
      }

      const categoryMap = groupedByDate.get(dateKey)
      categoryMap?.set(categoryName, (categoryMap?.get(categoryName) ?? 0) + toNumber(detail.jumlah_tiket))
    }

    return recapRows.map((row) => ({
      ...row,
      categoryBreakdown: Array.from((groupedByDate.get(row.dateKey) ?? new Map<string, number>()).entries()).map(
        ([categoryName, quantity]) => ({
          categoryName,
          quantity,
        })
      ),
    }))
  } catch (error) {
    console.error('Gagal menyusun breakdown kategori tiket export rekap:', error)
    return recapRows
  }
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

function createRpcParams(filters: ReportFilters) {
  return {
    p_start: filters.startDate ? getStartDateIso(filters.startDate) : null,
    p_end: filters.endDate ? getEndDateExclusiveIso(filters.endDate) : null,
    p_status: filters.status === 'semua' ? null : filters.status,
    p_search: filters.searchTerm.trim() || null,
    p_page: 1,
    p_page_size: EXPORT_ROW_LIMIT,
  }
}

function createSummaryRpcParams(filters: ReportFilters) {
  return {
    p_start: filters.startDate ? getStartDateIso(filters.startDate) : null,
    p_end: filters.endDate ? getEndDateExclusiveIso(filters.endDate) : null,
    p_status: filters.status === 'semua' ? null : filters.status,
    p_search: filters.searchTerm.trim() || null,
  }
}

function createExpenseRpcParams(filters: ReportFilters) {
  return {
    p_start: filters.startDate ? getStartDateIso(filters.startDate) : null,
    p_end: filters.endDate ? getEndDateExclusiveIso(filters.endDate) : null,
  }
}

function mapTransactionRow(row: ReportTransactionRpcRow): ReportTransaction {
  return {
    id: row.id,
    created_at: row.created_at,
    total_bayar: toNumber(row.total_bayar),
    total_tiket: toNumber(row.total_tiket),
    diskon_nominal: toNumber(row.diskon_nominal),
    metode_bayar: row.metode_bayar,
    status_transaksi: row.status_transaksi,
    refund_nominal: toNumber(row.refund_nominal),
    cancel_reason: row.cancel_reason,
    cancelled_at: row.cancelled_at,
    users_profile: row.petugas_nama_lengkap
      ? { nama_lengkap: row.petugas_nama_lengkap }
      : null,
  }
}

function mapRecapRow(row: DailyReportRpcRow): DailyReportRow {
  const revenue = toNumber(row.revenue)
  const expenses = toNumber(row.expenses)

  return {
    dateKey: row.date_key,
    label: formatJakartaDateFromKey(row.date_key),
    transactionCount: toNumber(row.transaction_count),
    cancelledCount: toNumber(row.cancelled_count),
    tickets: toNumber(row.tickets),
    discount: toNumber(row.discount),
    refund: toNumber(row.refund),
    expenses,
    netRevenue: row.net_revenue == null ? revenue - expenses : toNumber(row.net_revenue),
    revenue,
  }
}

function mapSummaryRow(row: ReportSummaryRpcRow): ReportSummary {
  return {
    revenue: toNumber(row.revenue),
    tickets: toNumber(row.tickets),
    discount: toNumber(row.discount),
    refund: toNumber(row.refund),
    expenses: 0,
    netRevenue: toNumber(row.revenue),
    cancelledCount: toNumber(row.cancelled_count),
    transactionCount: toNumber(row.transaction_count),
  }
}

function mergeRecapRows(rows: DailyReportRow[], expenseRows: DailyExpenseRpcRow[]) {
  const grouped = new Map<string, DailyReportRow>()

  for (const row of rows) {
    grouped.set(row.dateKey, {
      ...row,
      expenses: row.expenses ?? 0,
      netRevenue: row.revenue - (row.expenses ?? 0),
    })
  }

  for (const expenseRow of expenseRows) {
    const dateKey = expenseRow.date_key
    const expenseAmount = toNumber(expenseRow.expenses)
    const existing = grouped.get(dateKey)

    if (existing) {
      existing.expenses = expenseAmount
      existing.netRevenue = existing.revenue - expenseAmount
      continue
    }

    grouped.set(dateKey, {
      dateKey,
      label: formatJakartaDateFromKey(dateKey),
      transactionCount: 0,
      cancelledCount: 0,
      tickets: 0,
      discount: 0,
      refund: 0,
      expenses: expenseAmount,
      netRevenue: -expenseAmount,
      revenue: 0,
    })
  }

  return Array.from(grouped.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey))
}

export async function GET(request: Request) {
  const { supabase, denied } = await validateAdmin(request.url)

  if (denied) {
    return denied
  }

  const filters = parseReportFilters(new URL(request.url).searchParams)
  const rpcParams = createRpcParams(filters)
  const summaryRpcParams = createSummaryRpcParams(filters)
  const expenseRpcParams = createExpenseRpcParams(filters)

  const { data: summaryRows, error: summaryError } = await supabase
    .rpc('report_transaction_summary', summaryRpcParams)
    .returns<ReportSummaryRpcRow>()

  if (summaryError) {
    throw new Error(`Gagal memuat ringkasan laporan: ${summaryError.message}`)
  }

  const normalizedSummary = asFirstItem<ReportSummaryRpcRow>(summaryRows)

  const summary: ReportSummary = normalizedSummary
    ? mapSummaryRow(normalizedSummary)
    : {
        revenue: 0,
        tickets: 0,
        discount: 0,
        refund: 0,
        expenses: 0,
        netRevenue: 0,
        cancelledCount: 0,
        transactionCount: 0,
      }

  const { data: expenseSummaryRows, error: expenseSummaryError } = await supabase
    .rpc('report_expense_summary', expenseRpcParams)
    .returns<ExpenseSummaryRpcRow>()

  if (expenseSummaryError) {
    throw new Error(`Gagal memuat ringkasan pengeluaran: ${expenseSummaryError.message}`)
  }

  const normalizedExpenseSummary = asFirstItem<ExpenseSummaryRpcRow>(expenseSummaryRows)
  summary.expenses = normalizedExpenseSummary ? toNumber(normalizedExpenseSummary.expenses) : 0
  summary.netRevenue = summary.revenue - summary.expenses

  let transactions: ReportTransaction[] = []
  let recapRows: DailyReportRow[] = []

  if (filters.mode === 'rekap') {
    const { data: optimizedRecapResult, error: optimizedRecapError } = await supabase
      .rpc('report_daily_recap_with_expenses', {
        ...rpcParams,
        p_page: 1,
        p_page_size: EXPORT_ROW_LIMIT,
      })
      .returns<DailyReportRpcRow[]>()

    if (!optimizedRecapError) {
      recapRows = asArray<DailyReportRpcRow>(optimizedRecapResult).map(mapRecapRow)
    } else {
      const { data: recapResult, error: recapError } = await supabase
        .rpc('report_daily_recap', {
          ...rpcParams,
          p_page: 1,
          p_page_size: EXPORT_ROW_LIMIT,
        })
        .returns<DailyReportRpcRow[]>()

      if (recapError) {
        throw new Error(`Gagal memuat rekap harian: ${recapError.message}`)
      }

      const { data: expenseRecapRows, error: expenseRecapError } = await supabase
        .rpc('report_daily_expenses', expenseRpcParams)
        .returns<DailyExpenseRpcRow[]>()

      if (expenseRecapError) {
        throw new Error(`Gagal memuat pengeluaran harian: ${expenseRecapError.message}`)
      }

      recapRows = mergeRecapRows(
        asArray<DailyReportRpcRow>(recapResult).map(mapRecapRow),
        asArray<DailyExpenseRpcRow>(expenseRecapRows)
      )
    }
  } else {
    const { data: detailRows, error: detailError } = await supabase
      .rpc('report_filtered_transactions', rpcParams)
      .returns<ReportTransactionRpcRow[]>()

    if (detailError) {
      throw new Error(`Gagal memuat detail transaksi: ${detailError.message}`)
    }

    transactions = asArray<ReportTransactionRpcRow>(detailRows).map(mapTransactionRow)
  }

  if (filters.mode === 'rekap') {
    recapRows = await attachRecapCategoryBreakdown(supabase, recapRows, filters)
  }

  const reportTitle = filters.mode === 'rekap' ? 'Laporan Rekap Harian' : 'Laporan Detail Transaksi'
  const periodText = filters.startDate || filters.endDate
    ? `${filters.startDate || 'Awal'} s.d. ${filters.endDate || 'Sekarang'}`
    : 'Semua Periode'
  const searchText = filters.searchTerm || '-'

  const worksheetRows: (string | number)[][] = [
    [reportTitle],
    ['Periode', periodText],
    ['Pencarian', searchText],
    [],
  ]

  let columnWidths: Array<{ wch: number }>

  if (filters.mode === 'rekap') {
    worksheetRows.push(
      ['Tanggal', 'Jumlah Transaksi', 'Dibatalkan', 'Tiket Valid', 'Breakdown Kategori', 'Diskon', 'Refund', 'Pendapatan Tiket', 'Pengeluaran', 'Saldo Bersih'],
      ...recapRows.map((row: DailyReportRow) => [
        row.label,
        row.transactionCount,
        row.cancelledCount,
        row.tickets,
        formatCategoryBreakdown(row.categoryBreakdown),
        row.discount,
        row.refund,
        row.revenue,
        row.expenses,
        row.netRevenue,
      ])
    )

    columnWidths = [
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
    ]
  } else {
    worksheetRows.push(
      ['ID Transaksi', 'Waktu', 'Petugas', 'Jumlah Tiket', 'Status', 'Subtotal', 'Diskon', 'Total Bayar', 'Refund', 'Metode', 'Alasan Batal'],
      ...transactions.map((transaction) => [
        transaction.id,
        formatJakartaDateTime(transaction.created_at),
        getPetugasName(transaction) || 'Unknown',
        transaction.total_tiket,
        transaction.status_transaksi.toUpperCase(),
        transaction.total_bayar + (transaction.diskon_nominal || 0),
        transaction.status_transaksi === 'dibatalkan' ? 0 : (transaction.diskon_nominal || 0),
        transaction.status_transaksi === 'dibatalkan' ? 0 : transaction.total_bayar,
        transaction.status_transaksi === 'dibatalkan' ? (transaction.refund_nominal || transaction.total_bayar || 0) : 0,
        transaction.metode_bayar.toUpperCase(),
        transaction.cancel_reason || '',
      ])
    )

    columnWidths = [
      { wch: 38 },
      { wch: 24 },
      { wch: 22 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 28 },
    ]
  }

  worksheetRows.push(
    [],
    ['Ringkasan'],
    ['Total Pendapatan', summary.revenue],
    ['Total Tiket', summary.tickets],
    ['Total Diskon', summary.discount],
    ['Total Refund', summary.refund],
    ['Total Pengeluaran', summary.expenses],
    ['Saldo Bersih', summary.netRevenue],
    ['Total Dibatalkan', summary.cancelledCount]
  )

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows)
  worksheet['!cols'] = columnWidths
  worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: filters.mode === 'rekap' ? 9 : 10 } }]

  if (filters.mode === 'rekap') {
    applyNumberFormat(worksheet, 5, 4 + recapRows.length, [1, 2, 3, 5, 6, 7, 8, 9])
    applyNumberFormat(worksheet, 8 + recapRows.length, 14 + recapRows.length, [1])
    applyWorksheetLayout(worksheet, 4, 4 + recapRows.length, 9)
  } else {
    applyNumberFormat(worksheet, 5, 4 + transactions.length, [3, 5, 6, 7, 8])
    applyNumberFormat(worksheet, 8 + transactions.length, 14 + transactions.length, [1])
    applyWorksheetLayout(worksheet, 4, 4 + transactions.length, 10)
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, filters.mode === 'rekap' ? 'Rekap Harian' : 'Detail')

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  const fileName = `${filters.mode === 'rekap' ? 'Rekap_Harian' : 'Laporan_Detail'}_Banyupanas_${getJakartaTodayDate()}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}







