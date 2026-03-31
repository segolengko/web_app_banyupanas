import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { authenticateIntegrationRequest } from '@/utils/integration-auth'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500
const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
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

function parseDateParam(value: string | null) {
  const normalized = value?.trim() || null
  if (!normalized) return null

  return DATE_PARAM_PATTERN.test(normalized) ? normalized : false
}

export async function GET(request: NextRequest) {
  const auth = await authenticateIntegrationRequest(request, 'transactions:read')

  if (!auth) {
    return noStoreJson(
      {
        error: 'UNAUTHORIZED',
        message: 'API key tidak valid atau tidak memiliki scope transactions:read.',
      },
      401,
    )
  }

  const { searchParams } = new URL(request.url)
  const page = parsePositiveInt(searchParams.get('page'), 1)
  const limit = Math.min(parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT), MAX_LIMIT)
  const status = parseStatus(searchParams.get('status'))
  const startDate = parseDateParam(searchParams.get('start_date'))
  const endDate = parseDateParam(searchParams.get('end_date'))

  if (startDate === false || endDate === false) {
    return noStoreJson(
      {
        error: 'INVALID_QUERY',
        message: 'Format tanggal harus YYYY-MM-DD.',
      },
      400,
    )
  }

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
    console.error('Integration transactions query failed', {
      countError,
      dataError,
      page,
      limit,
      status,
      startDate,
      endDate,
      clientId: auth.clientId,
    })

    return noStoreJson(
      {
        error: 'QUERY_FAILED',
        message: 'Gagal mengambil data transaksi integrasi.',
      },
      500,
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
      console.error('Integration user profile lookup failed', {
        userProfilesError,
        clientId: auth.clientId,
        userIds,
      })

      return noStoreJson(
        {
          error: 'QUERY_FAILED',
          message: 'Gagal mengambil data transaksi integrasi.',
        },
        500,
      )
    }

    userNameMap = new Map((userProfiles ?? []).map((profile) => [profile.id, profile.nama_lengkap]))
  }

  return noStoreJson({
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
