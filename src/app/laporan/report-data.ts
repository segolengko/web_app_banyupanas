import { createClient } from '@/utils/supabase/server'
import type { DailyReportRow, ReportFilters, ReportSummary, ReportTransaction, TicketBreakdownItem } from '@/types/admin'
import { REPORT_PAGE_SIZE, getEndDateExclusiveIso, getStartDateIso } from '@/utils/report-params'
import { formatJakartaDateFromKey, getJakartaDateKey } from '@/utils/jakarta-time'

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

export type ReportPageData = {
  transactions: ReportTransaction[]
  recapRows: DailyReportRow[]
  summary: ReportSummary
  totalItems: number
  totalPages: number
}

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

function mapTicketBreakdown(details: TransactionDetailRow[]) {
  const grouped = new Map<string, number>()

  for (const detail of details) {
    const categoryName = resolveCategoryName(detail) ?? 'Kategori tiket'
    grouped.set(categoryName, (grouped.get(categoryName) ?? 0) + toNumber(detail.jumlah_tiket))
  }

  return Array.from(grouped.entries()).map(([categoryName, quantity]) => ({
    categoryName,
    quantity,
  })) satisfies TicketBreakdownItem[]
}

async function attachTicketBreakdown(
  supabase: Awaited<ReturnType<typeof createClient>>,
  transactions: ReportTransaction[]
) {
  if (transactions.length === 0) {
    return transactions
  }

  const transactionIds = transactions.map((transaction) => transaction.id)
  const { data, error } = await supabase
    .from('transaksi_detail')
    .select('transaksi_id,jumlah_tiket,kategori_tiket(nama_kategori)')
    .in('transaksi_id', transactionIds)
    .order('id', { ascending: true })

  if (error) {
    throw new Error(`Gagal memuat detail kategori tiket: ${error.message}`)
  }

  const detailRows = asArray<TransactionDetailRow>(data)
  const grouped = new Map<string, TransactionDetailRow[]>()

  for (const detail of detailRows) {
    const transactionId = detail.transaksi_id
    if (!grouped.has(transactionId)) {
      grouped.set(transactionId, [])
    }

    grouped.get(transactionId)?.push(detail)
  }

  return transactions.map((transaction) => ({
    ...transaction,
    ticket_breakdown: mapTicketBreakdown(grouped.get(transaction.id) ?? []),
  }))
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

function createRpcParams(filters: ReportFilters, pageSize: number) {
  return {
    p_start: filters.startDate ? getStartDateIso(filters.startDate) : null,
    p_end: filters.endDate ? getEndDateExclusiveIso(filters.endDate) : null,
    p_status: filters.status === 'semua' ? null : filters.status,
    p_search: filters.searchTerm.trim() || null,
    p_page: filters.page,
    p_page_size: pageSize,
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
      console.error('Gagal memuat transaksi untuk breakdown rekap:', visibleTransactionsError.message)
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
      console.error('Gagal memuat detail kategori tiket rekap:', detailError.message)
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
      ) satisfies TicketBreakdownItem[],
    }))
  } catch (error) {
    console.error('Gagal menyusun breakdown kategori tiket rekap:', error)
    return recapRows
  }
}
export async function getReportPageData(filters: ReportFilters, options?: { pageSize?: number; forceAllRows?: boolean }) {
  const supabase = await createClient()
  const pageSize = options?.pageSize ?? REPORT_PAGE_SIZE
  const fetchAll = options?.forceAllRows ?? false
  const rpcParams = createRpcParams(filters, pageSize)
  const summaryRpcParams = createSummaryRpcParams(filters)

  let transactions: ReportTransaction[] = []
  let recapRows: DailyReportRow[] = []
  let totalItems = 0
  let totalPages = 1
  let summary: ReportSummary = {
    revenue: 0,
    tickets: 0,
    discount: 0,
    refund: 0,
    expenses: 0,
    netRevenue: 0,
    cancelledCount: 0,
    transactionCount: 0,
  }

  const { data: summaryRows, error: summaryError } = await supabase
    .rpc('report_transaction_summary', summaryRpcParams)
    .returns<ReportSummaryRpcRow>()

  if (summaryError) {
    throw new Error(`Gagal memuat ringkasan laporan: ${summaryError.message}`)
  }

  const normalizedSummary = asFirstItem<ReportSummaryRpcRow>(summaryRows)

  if (normalizedSummary) {
    summary = mapSummaryRow(normalizedSummary)
  }

  const { data: expenseSummaryRows, error: expenseSummaryError } = await supabase
    .rpc('report_expense_summary', createExpenseRpcParams(filters))
    .returns<ExpenseSummaryRpcRow>()

  if (expenseSummaryError) {
    throw new Error(`Gagal memuat ringkasan pengeluaran: ${expenseSummaryError.message}`)
  }

  const normalizedExpenseSummary = asFirstItem<ExpenseSummaryRpcRow>(expenseSummaryRows)

  if (normalizedExpenseSummary) {
    summary.expenses = toNumber(normalizedExpenseSummary.expenses)
    summary.netRevenue = summary.revenue - summary.expenses
  } else {
    summary.netRevenue = summary.revenue
  }

  if (filters.mode === 'rekap') {
    const recapRpcParams = {
      ...rpcParams,
      p_page: fetchAll ? 1 : rpcParams.p_page,
      p_page_size: fetchAll ? 5000 : rpcParams.p_page_size,
    }

    const { data: optimizedRecapResult, error: optimizedRecapError } = await supabase
      .rpc('report_daily_recap_with_expenses', recapRpcParams)
      .returns<DailyReportRpcRow[]>()

    if (!optimizedRecapError) {
      const normalizedRecapRows = asArray<DailyReportRpcRow>(optimizedRecapResult)
      recapRows = normalizedRecapRows.map(mapRecapRow)
      totalItems = toNumber(normalizedRecapRows[0]?.total_items) || recapRows.length
    } else {
      const { data: recapResult, error: recapError } = await supabase
        .rpc('report_daily_recap', {
          ...rpcParams,
          p_page: 1,
          p_page_size: 5000,
        })
        .returns<DailyReportRpcRow[]>()

      if (recapError) {
        throw new Error(`Gagal memuat rekap harian: ${recapError.message}`)
      }

      const normalizedRecapRows = asArray<DailyReportRpcRow>(recapResult)
      const { data: expenseRecapRows, error: expenseRecapError } = await supabase
        .rpc('report_daily_expenses', createExpenseRpcParams(filters))
        .returns<DailyExpenseRpcRow[]>()

      if (expenseRecapError) {
        throw new Error(`Gagal memuat pengeluaran harian: ${expenseRecapError.message}`)
      }

      const mergedRecapRows = mergeRecapRows(
        normalizedRecapRows.map(mapRecapRow),
        asArray<DailyExpenseRpcRow>(expenseRecapRows)
      )

      if (fetchAll) {
        totalItems = mergedRecapRows.length
        recapRows = mergedRecapRows
      } else {
        const from = (filters.page - 1) * pageSize
        const to = from + pageSize
        totalItems = mergedRecapRows.length
        recapRows = mergedRecapRows.slice(from, to)
      }
    }
  } else {
    const { data: detailRows, error: detailError } = await supabase
      .rpc('report_filtered_transactions', {
        ...rpcParams,
        p_page: fetchAll ? 1 : rpcParams.p_page,
        p_page_size: fetchAll ? 5000 : rpcParams.p_page_size,
      })
      .returns<ReportTransactionRpcRow[]>()

    if (detailError) {
      throw new Error(`Gagal memuat detail transaksi: ${detailError.message}`)
    }

    const normalizedDetailRows = asArray<ReportTransactionRpcRow>(detailRows)
    transactions = await attachTicketBreakdown(supabase, normalizedDetailRows.map(mapTransactionRow))
    totalItems = toNumber(normalizedDetailRows[0]?.total_items)
  }

  if (filters.mode === 'rekap') {
    recapRows = await attachRecapCategoryBreakdown(supabase, recapRows, filters)
  }

  totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1

  return {
    transactions,
    recapRows,
    summary,
    totalItems,
    totalPages,
  } satisfies ReportPageData
}





