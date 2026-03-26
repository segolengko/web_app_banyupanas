export type StaffMember = {
  id: string
  nama_lengkap: string
  email: string
  is_active: boolean
}

export type TransactionProfile = {
  nama_lengkap: string
}

export type TransactionStatus = 'selesai' | 'dibatalkan'

export type ReportTransaction = {
  id: string
  created_at: string
  total_bayar: number
  total_tiket: number
  diskon_nominal: number
  metode_bayar: string
  status_transaksi: TransactionStatus
  refund_nominal: number
  cancel_reason: string | null
  cancelled_at: string | null
  users_profile: TransactionProfile | TransactionProfile[] | null
}

export type ReportFilters = {
  page: number
  mode: 'detail' | 'rekap'
  searchTerm: string
  startDate: string
  endDate: string
  status: 'semua' | TransactionStatus
}

export type ReportSummary = {
  revenue: number
  tickets: number
  discount: number
  refund: number
  cancelledCount: number
  transactionCount: number
}

export type DailyReportRow = {
  dateKey: string
  label: string
  transactionCount: number
  cancelledCount: number
  tickets: number
  discount: number
  refund: number
  revenue: number
}
