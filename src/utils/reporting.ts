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

export function isCancelledTransaction(transaction: ReportTransaction) {
  return transaction.status_transaksi === 'dibatalkan'
}

export function getTransactionRefund(transaction: ReportTransaction) {
  if (!isCancelledTransaction(transaction)) {
    return 0
  }

  return transaction.refund_nominal ?? transaction.total_bayar ?? 0
}

export function summarizeTransactions(transactions: ReportTransaction[]): ReportSummary {
  return transactions.reduce<ReportSummary>((accumulator, transaction) => {
    const cancelled = isCancelledTransaction(transaction)

    return {
      revenue: accumulator.revenue + (cancelled ? 0 : (transaction.total_bayar ?? 0)),
      tickets: accumulator.tickets + (cancelled ? 0 : (transaction.total_tiket ?? 0)),
      discount: accumulator.discount + (cancelled ? 0 : (transaction.diskon_nominal ?? 0)),
      refund: accumulator.refund + getTransactionRefund(transaction),
      expenses: accumulator.expenses,
      netRevenue: accumulator.netRevenue + (cancelled ? 0 : (transaction.total_bayar ?? 0)),
      cancelledCount: accumulator.cancelledCount + (cancelled ? 1 : 0),
      transactionCount: accumulator.transactionCount + 1,
    }
  }, {
    revenue: 0,
    tickets: 0,
    discount: 0,
    refund: 0,
    expenses: 0,
    netRevenue: 0,
    cancelledCount: 0,
    transactionCount: 0,
  })
}

export function groupTransactionsByDate(transactions: ReportTransaction[]): DailyReportRow[] {
  const grouped = transactions.reduce<Map<string, DailyReportRow>>((map, transaction) => {
    const date = new Date(transaction.created_at)
    const dateKey = date.toISOString().split('T')[0]
    const existing = map.get(dateKey)
    const cancelled = isCancelledTransaction(transaction)
    const refund = getTransactionRefund(transaction)

    if (existing) {
      existing.transactionCount += 1
      existing.cancelledCount += cancelled ? 1 : 0
      existing.tickets += cancelled ? 0 : (transaction.total_tiket ?? 0)
      existing.discount += cancelled ? 0 : (transaction.diskon_nominal ?? 0)
      existing.refund += refund
      existing.revenue += cancelled ? 0 : (transaction.total_bayar ?? 0)
      existing.netRevenue += cancelled ? 0 : (transaction.total_bayar ?? 0)
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
      cancelledCount: cancelled ? 1 : 0,
      tickets: cancelled ? 0 : (transaction.total_tiket ?? 0),
      discount: cancelled ? 0 : (transaction.diskon_nominal ?? 0),
      refund,
      expenses: 0,
      netRevenue: cancelled ? 0 : (transaction.total_bayar ?? 0),
      revenue: cancelled ? 0 : (transaction.total_bayar ?? 0),
    })

    return map
  }, new Map())

  return Array.from(grouped.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey))
}

export function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}
