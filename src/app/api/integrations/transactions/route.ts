import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { authenticateIntegrationRequest } from '@/utils/integration-auth'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

type TransactionRow = {
  id: string
  created_at: string
  petugas_id: string
  total_tiket: number
  subtotal_harga: number
  diskon_nominal: number
  total_bayar: number
  metode_bayar: string | null
  status_transaksi: string
  refund_nominal: number | null
  cancel_reason: string | null
  cancelled_at: string | null
}

type UserProfileRow = {
  id: string
  nama_lengkap: string | null
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseStatus(value: string | null) {
  if (value === 'selesai' || value === 'dibatalkan') {
    return value
  }

  return null
}

export async function GET(request: NextRequest) {
  const auth = await authenticateIntegrationRequest(request, 'transactions:read')

  if (!auth) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'API key tidak valid atau tidak memiliki scope transactions:read.',
      },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(request.url)
  const page = parsePositiveInt(searchParams.get('page'), 1)
  const limit = Math.min(parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT), MAX_LIMIT)
  const status = parseStatus(searchParams.get('status'))
  const startDate = searchParams.get('start_date')?.trim() || null
  const endDate = searchParams.get('end_date')?.trim() || null
  const from = (page - 1) * limit
  const to = from + limit - 1

  const admin = createAdminClient()
  let countQuery = admin
    .from('transaksi')
    .select('id', { count: 'exact', head: true })

  let dataQuery = admin
    .from('transaksi')
    .select('id,created_at,petugas_id,total_tiket,subtotal_harga,diskon_nominal,total_bayar,metode_bayar,status_transaksi,refund_nominal,cancel_reason,cancelled_at')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) {
    countQuery = countQuery.eq('status_transaksi', status)
    dataQuery = dataQuery.eq('status_transaksi', status)
  }

  if (startDate) {
    const startIso = `${startDate}T00:00:00+07:00`
    countQuery = countQuery.gte('created_at', startIso)
    dataQuery = dataQuery.gte('created_at', startIso)
  }

  if (endDate) {
    const endIso = `${endDate}T23:59:59.999+07:00`
    countQuery = countQuery.lte('created_at', endIso)
    dataQuery = dataQuery.lte('created_at', endIso)
  }

  const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
    countQuery,
    dataQuery.returns<TransactionRow[]>(),
  ])

  if (countError || dataError) {
    return NextResponse.json(
      {
        error: 'QUERY_FAILED',
        message: 'Gagal mengambil data transaksi integrasi.',
        details: dataError?.message ?? countError?.message ?? null,
      },
      { status: 500 },
    )
  }

  const rows = Array.isArray(data) ? data : []
  const userIds = Array.from(new Set(rows.map((row) => row.petugas_id).filter(Boolean)))
  let userNameMap = new Map<string, string | null>()

  if (userIds.length > 0) {
    const { data: userProfiles, error: userProfilesError } = await admin
      .from('users_profile')
      .select('id,nama_lengkap')
      .in('id', userIds)
      .returns<UserProfileRow[]>()

    if (userProfilesError) {
      return NextResponse.json(
        {
          error: 'QUERY_FAILED',
          message: 'Gagal mengambil data petugas integrasi.',
          details: userProfilesError.message,
        },
        { status: 500 },
      )
    }

    userNameMap = new Map((userProfiles ?? []).map((profile) => [profile.id, profile.nama_lengkap]))
  }

  return NextResponse.json({
    data: rows.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      petugas_id: row.petugas_id,
      petugas_nama: userNameMap.get(row.petugas_id) ?? null,
      total_tiket: row.total_tiket ?? 0,
      subtotal_harga: row.subtotal_harga ?? 0,
      diskon_nominal: row.diskon_nominal ?? 0,
      total_bayar: row.total_bayar ?? 0,
      metode_bayar: row.metode_bayar ?? 'tunai',
      status_transaksi: row.status_transaksi,
      refund_nominal: row.refund_nominal ?? 0,
      cancel_reason: row.cancel_reason,
      cancelled_at: row.cancelled_at,
    })),
    meta: {
      page,
      limit,
      total_items: count ?? rows.length,
      total_pages: Math.max(1, Math.ceil((count ?? rows.length) / limit)),
      filters: {
        start_date: startDate,
        end_date: endDate,
        status: status ?? 'semua',
      },
      api_client: auth.clientName,
    },
  })
}
