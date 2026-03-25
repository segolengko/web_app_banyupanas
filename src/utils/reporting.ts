import type { DailyReportRow, ReportSummary, ReportTransaction } from '@/types/admin'

export function getPetugasName(transaction: ReportTransaction) {
  return Array.isArray(transaction.users_profile)
    ? transaction.users_profile[0]?.nama_lengkap
    : transaction.users_profile?.nama_lengkap
}

export function filterTransactionsBySearch(transactions: ReportTransaction[], searchTerm: string) {
  const needle = searchTerm.trim().toLowerCase()

  if (!needle) {
    return transactions
  }

  return transactions.filter((transaction) => {
    const petugasName = getPetugasName(transaction)?.toLowerCase() ?? ''
    const transactionId = transaction.id.toLowerCase()

    return petugasName.includes(needle) || transactionId.includes(needle)
  })
}

export function summarizeTransactions(transactions: ReportTransaction[]): ReportSummary {
  return transactions.reduce<ReportSummary>((accumulator, transaction) => ({
    revenue: accumulator.revenue + (transaction.total_bayar ?? 0),
    tickets: accumulator.tickets + (transaction.total_tiket ?? 0),
    discount: accumulator.discount + (transaction.diskon_nominal ?? 0),
  }), {
    revenue: 0,
    tickets: 0,
    discount: 0,
  })
}

export function groupTransactionsByDate(transactions: ReportTransaction[]): DailyReportRow[] {
  const grouped = transactions.reduce<Map<string, DailyReportRow>>((map, transaction) => {
    const date = new Date(transaction.created_at)
    const dateKey = date.toISOString().split('T')[0]
    const existing = map.get(dateKey)

    if (existing) {
      existing.transactionCount += 1
      existing.tickets += transaction.total_tiket ?? 0
      existing.discount += transaction.diskon_nominal ?? 0
      existing.revenue += transaction.total_bayar ?? 0
      return map
    }

    map.set(dateKey, {
      dateKey,
      label: date.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      transactionCount: 1,
      tickets: transaction.total_tiket ?? 0,
      discount: transaction.diskon_nominal ?? 0,
      revenue: transaction.total_bayar ?? 0,
    })

    return map
  }, new Map())

  return Array.from(grouped.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey))
}

export function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}
