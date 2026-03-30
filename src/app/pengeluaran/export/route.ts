import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/server'
import { hasAllowedRole, SUPERVISOR_ROLES } from '@/utils/supabase/check-admin'
import type { ExpensePaymentMethod } from '@/types/admin'
import { getEndDateExclusiveIso, getStartDateIso } from '@/utils/report-params'

type ExpenseExportRow = {
  id: string
  expense_at: string
  nominal: number
  category: string
  description: string | null
  payment_method: ExpensePaymentMethod
  users_profile: Array<{
    nama_lengkap: string
  }> | null
}

function applyNumberFormat(
  worksheet: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  columns: number[],
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

function readValue(searchParams: URLSearchParams, key: string) {
  return (searchParams.get(key) ?? '').trim()
}

async function validateUser(requestUrl: string) {
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

function formatDateDisplay(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export async function GET(request: Request) {
  const { supabase, denied } = await validateUser(request.url)

  if (denied) {
    return denied
  }

  const url = new URL(request.url)
  const startDate = readValue(url.searchParams, 'startDate')
  const endDate = readValue(url.searchParams, 'endDate')
  const category = readValue(url.searchParams, 'category')

  let query = supabase
    .from('operational_expenses')
    .select('id, expense_at, nominal, category, description, payment_method, users_profile(nama_lengkap)')
    .order('expense_at', { ascending: false })
    .limit(100000)

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
  const expenses = (data ?? []) as ExpenseExportRow[]
  const totalNominal = expenses.reduce((sum, item) => sum + (item.nominal || 0), 0)
  const periodText = startDate || endDate
    ? `${startDate || 'Awal'} s.d. ${endDate || 'Sekarang'}`
    : 'Semua Periode'

  const rows: (string | number)[][] = [
    ['Laporan Pengeluaran Operasional'],
    ['Periode', periodText],
    ['Kategori Filter', category || 'Semua Kategori'],
    [],
    ['Tanggal', 'Kategori', 'Metode', 'Nominal', 'Keterangan', 'Dicatat Oleh'],
    ...expenses.map((expense) => [
      formatDateDisplay(expense.expense_at),
      expense.category,
      expense.payment_method.toUpperCase(),
      expense.nominal,
      expense.description || '-',
      expense.users_profile?.[0]?.nama_lengkap || '-',
    ]),
    [],
    ['Ringkasan'],
    ['Jumlah Catatan', expenses.length],
    ['Total Pengeluaran', totalNominal],
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 42 },
    { wch: 24 },
  ]

  worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]
  worksheet['!rows'] = [
    { hpt: 26 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 10 },
    { hpt: 22 },
  ]
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 4, c: 0 },
      e: { r: Math.max(4, 4 + expenses.length), c: 5 },
    }),
  }

  applyNumberFormat(worksheet, 5, 4 + expenses.length, [3])
  applyNumberFormat(worksheet, 8 + expenses.length, 9 + expenses.length, [1])

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengeluaran')

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  const fileName = `Pengeluaran_Banyupanas_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
