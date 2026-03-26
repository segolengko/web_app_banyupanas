export type StaffMember = {
  id: string
  nama_lengkap: string
  email: string
  is_active: boolean
}

export type ManagedUserRole = 'super_admin' | 'admin' | 'supervisor' | 'petugas'

export type ManagedUser = {
  id: string
  nama_lengkap: string
  email: string
  role: ManagedUserRole
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
  expenses: number
  netRevenue: number
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
  expenses: number
  netRevenue: number
  revenue: number
}

export type ExpensePaymentMethod = 'tunai' | 'transfer' | 'qris' | 'lainnya'

export type OperationalExpense = {
  id: string
  expense_at: string
  nominal: number
  category: string
  description: string | null
  payment_method: ExpensePaymentMethod
  created_by_name: string | null
}
