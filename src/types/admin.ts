export type StaffMember = {
  id: string
  nama_lengkap: string
  email: string
  is_active: boolean
}

export type TransactionProfile = {
  nama_lengkap: string
}

export type ReportTransaction = {
  id: string
  created_at: string
  total_bayar: number
  total_tiket: number
  diskon_nominal: number
  metode_bayar: string
  users_profile: TransactionProfile | TransactionProfile[] | null
}

export type ReportFilters = {
  page: number
  mode: 'detail' | 'rekap'
  searchTerm: string
  startDate: string
  endDate: string
}

export type ReportSummary = {
  revenue: number
  tickets: number
  discount: number
}

export type DailyReportRow = {
  dateKey: string
  label: string
  transactionCount: number
  tickets: number
  discount: number
  revenue: number
}
