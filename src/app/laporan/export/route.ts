import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/server'
import type { DailyReportRow, ReportFilters, ReportTransaction } from '@/types/admin'
import { getEndDateExclusiveIso, getStartDateIso, parseReportFilters } from '@/utils/report-params'
import { filterTransactionsBySearch, getPetugasName, groupTransactionsByDate, summarizeTransactions } from '@/utils/reporting'

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

  if (!profile || profile.role !== 'admin') {
    await supabase.auth.signOut()
    return {
      supabase,
      denied: NextResponse.redirect(new URL('/login?message=Akses Ditolak: Dashboard ini hanya untuk Administrator.', requestUrl)),
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

export async function GET(request: Request) {
  const { supabase, denied } = await validateAdmin(request.url)

  if (denied) {
    return denied
  }

  const filters = parseReportFilters(new URL(request.url).searchParams)

  let query = supabase
    .from('transaksi')
    .select(`
      id,
      created_at,
      total_bayar,
      total_tiket,
      diskon_nominal,
      metode_bayar,
      users_profile!inner (nama_lengkap)
    `)
    .order('created_at', { ascending: false })

  query = applyDateFilters(query, filters)

  const { data: rows } = await query
  const transactions = filterTransactionsBySearch((rows ?? []) as ReportTransaction[], filters.searchTerm)
  const recapRows = groupTransactionsByDate(transactions)

  const summary = summarizeTransactions(transactions)

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
      ['Tanggal', 'Jumlah Transaksi', 'Tiket', 'Diskon', 'Pendapatan'],
      ...recapRows.map((row: DailyReportRow) => [
        row.label,
        row.transactionCount,
        row.tickets,
        row.discount,
        row.revenue,
      ])
    )

    columnWidths = [
      { wch: 24 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
    ]
  } else {
    worksheetRows.push(
      ['ID Transaksi', 'Waktu', 'Petugas', 'Jumlah Tiket', 'Subtotal', 'Diskon', 'Total Bayar', 'Metode'],
      ...transactions.map((transaction) => [
        transaction.id,
        new Date(transaction.created_at).toLocaleString('id-ID'),
        getPetugasName(transaction) || 'Unknown',
        transaction.total_tiket,
        transaction.total_bayar + (transaction.diskon_nominal || 0),
        transaction.diskon_nominal || 0,
        transaction.total_bayar,
        transaction.metode_bayar.toUpperCase(),
      ])
    )

    columnWidths = [
      { wch: 38 },
      { wch: 24 },
      { wch: 22 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
    ]
  }

  worksheetRows.push(
    [],
    ['Ringkasan'],
    ['Total Pendapatan', summary.revenue],
    ['Total Tiket', summary.tickets],
    ['Total Diskon', summary.discount]
  )

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows)
  worksheet['!cols'] = columnWidths
  worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: filters.mode === 'rekap' ? 4 : 7 } }]

  if (filters.mode === 'rekap') {
    applyNumberFormat(worksheet, 5, 4 + recapRows.length, [1, 2, 3, 4])
    applyNumberFormat(worksheet, 8 + recapRows.length, 10 + recapRows.length, [1])
    applyWorksheetLayout(worksheet, 4, 4 + recapRows.length, 4)
  } else {
    applyNumberFormat(worksheet, 5, 4 + transactions.length, [3, 4, 5, 6])
    applyNumberFormat(worksheet, 8 + transactions.length, 10 + transactions.length, [1])
    applyWorksheetLayout(worksheet, 4, 4 + transactions.length, 7)
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, filters.mode === 'rekap' ? 'Rekap Harian' : 'Detail')

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  const fileName = `${filters.mode === 'rekap' ? 'Rekap_Harian' : 'Laporan_Detail'}_Banyupanas_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
