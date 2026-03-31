import { createClient } from '@/utils/supabase/server'
import { getEndDateExclusiveIso, getStartDateIso } from '@/utils/report-params'
import { formatJakartaDate } from '@/utils/jakarta-time'

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

export type ClosingSummaryData = {
  closingDate: string
  totalTransactions: number
  totalTickets: number
  grossRevenue: number
  totalDiscount: number
  totalRefund: number
  totalExpenses: number
  netRevenue: number
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

export function formatDateDisplay(value: string) {
  return formatJakartaDate(value)
}

export async function getClosingSummaryData(closingDate: string): Promise<ClosingSummaryData> {
  const supabase = await createClient()

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

  return {
    closingDate,
    totalTransactions,
    totalTickets,
    grossRevenue,
    totalDiscount,
    totalRefund,
    totalExpenses,
    netRevenue,
  }
}
