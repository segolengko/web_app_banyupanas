import { checkAdminAccess } from '@/utils/supabase/check-admin'
import Sidebar from '@/components/sidebar'
import { createClient } from '@/utils/supabase/server'
import ReportList from '@/components/report-list'
import type { DailyReportRow, ReportFilters, ReportTransaction } from '@/types/admin'
import { REPORT_PAGE_SIZE, getEndDateExclusiveIso, getReportRange, getStartDateIso, parseReportFilters } from '@/utils/report-params'
import { filterTransactionsBySearch, groupTransactionsByDate, summarizeTransactions } from '@/utils/reporting'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function applyDateFilters<T extends {
  gte: (column: string, value: string) => T
  lt: (column: string, value: string) => T
}>(query: T, filters: ReportFilters) {
  let nextQuery = query

  if (filters.startDate) {
    nextQuery = nextQuery.gte('created_at', getStartDateIso(filters.startDate))
  }

  if (filters.endDate) {
    nextQuery = nextQuery.lt('created_at', getEndDateExclusiveIso(filters.endDate))
  }

  return nextQuery
}

function applyStatusFilter<T extends {
  eq: (column: string, value: string) => T
}>(query: T, filters: ReportFilters) {
  if (filters.status === 'semua') {
    return query
  }

  return query.eq('status_transaksi', filters.status)
}

export default async function LaporanPage({ searchParams }: PageProps) {
  await checkAdminAccess()
  const supabase = await createClient()
  const filters = parseReportFilters((await searchParams) ?? {})
  const { from, to } = getReportRange(filters.page)
  const hasSearchTerm = filters.searchTerm.trim().length > 0

  let transactions: ReportTransaction[] = []
  let recapRows: DailyReportRow[] = []
  let totalItems = 0
  let totalPages = 1
  let summary = summarizeTransactions([])

  if (hasSearchTerm || filters.mode === 'rekap') {
    let searchQuery = supabase
      .from('transaksi')
      .select(`
        id,
        created_at,
        total_bayar,
        total_tiket,
        diskon_nominal,
        metode_bayar,
        status_transaksi,
        refund_nominal,
        cancel_reason,
        cancelled_at,
        users_profile!transaksi_petugas_id_fkey (nama_lengkap)
      `)
      .order('created_at', { ascending: false })

    searchQuery = applyDateFilters(searchQuery, filters)
    searchQuery = applyStatusFilter(searchQuery, filters)

    const { data: rows } = await searchQuery
    const filteredRows = filterTransactionsBySearch((rows ?? []) as ReportTransaction[], filters.searchTerm)
    recapRows = groupTransactionsByDate(filteredRows)
    const sourceRows = filters.mode === 'rekap' ? recapRows : filteredRows

    totalItems = sourceRows.length
    totalPages = totalItems > 0 ? Math.ceil(totalItems / REPORT_PAGE_SIZE) : 1
    summary = summarizeTransactions(filteredRows)

    if (filters.mode === 'rekap') {
      recapRows = sourceRows.slice(from, to + 1) as DailyReportRow[]
    } else {
      transactions = sourceRows.slice(from, to + 1) as ReportTransaction[]
    }
  } else {
    let countQuery = supabase.from('transaksi').select('id', { count: 'exact', head: true })
    countQuery = applyDateFilters(countQuery, filters)
    countQuery = applyStatusFilter(countQuery, filters)

    const { count } = await countQuery
    totalItems = count ?? 0
    totalPages = totalItems > 0 ? Math.ceil(totalItems / REPORT_PAGE_SIZE) : 1

    let summaryQuery = supabase
      .from('transaksi')
      .select('total_bayar, total_tiket, diskon_nominal, status_transaksi, refund_nominal, cancel_reason, cancelled_at')
    summaryQuery = applyDateFilters(summaryQuery, filters)
    summaryQuery = applyStatusFilter(summaryQuery, filters)

    const { data: summaryRows } = await summaryQuery
    summary = summarizeTransactions((summaryRows ?? []) as ReportTransaction[])

    let reportQuery = supabase
      .from('transaksi')
      .select(`
        id,
        created_at,
        total_bayar,
        total_tiket,
        diskon_nominal,
        metode_bayar,
        status_transaksi,
        refund_nominal,
        cancel_reason,
        cancelled_at,
        users_profile!transaksi_petugas_id_fkey (nama_lengkap)
      `)
      .order('created_at', { ascending: false })
      .range(from, to)

    reportQuery = applyDateFilters(reportQuery, filters)
    reportQuery = applyStatusFilter(reportQuery, filters)

    const { data: rows } = await reportQuery
    transactions = (rows ?? []) as ReportTransaction[]
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header style={{ marginBottom: '40px' }} className="no-print">
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Laporan Transaksi</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Filter, analisis, dan ekspor data transaksi petugas Anda.</p>
        </header>

        <ReportList
          detailData={transactions}
          recapData={recapRows}
          filters={filters}
          summary={summary}
          totalItems={totalItems}
          totalPages={totalPages}
        />
      </main>
    </div>
  )
}
