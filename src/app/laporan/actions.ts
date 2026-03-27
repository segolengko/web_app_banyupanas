'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAccess } from '@/utils/supabase/check-admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

type CancelTransactionInput = {
  transactionId: string
  cancelReason: string
}

function getJakartaDateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export async function cancelTransactionAction(input: CancelTransactionInput) {
  await checkAdminAccess()

  const reason = input.cancelReason.trim()
  if (!input.transactionId) {
    return { error: 'ID transaksi tidak ditemukan.' }
  }

  if (!reason) {
    return { error: 'Alasan pembatalan wajib diisi.' }
  }
  
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesi admin tidak ditemukan.' }
  }

  const adminClient = createAdminClient()

  const { data: transaction, error: fetchError } = await adminClient
    .from('transaksi')
    .select('id, total_bayar, status_transaksi, created_at')
    .eq('id', input.transactionId)
    .single<{ id: string; total_bayar: number; status_transaksi: 'selesai' | 'dibatalkan'; created_at: string }>()

  if (fetchError || !transaction) {
    return { error: 'Transaksi tidak ditemukan.' }
  }

  if (transaction.status_transaksi === 'dibatalkan') {
    return { error: 'Transaksi ini sudah dibatalkan sebelumnya.' }
  }

  if (getJakartaDateKey(transaction.created_at) !== getJakartaDateKey(new Date())) {
    return { error: 'Pembatalan hanya boleh dilakukan pada tanggal transaksi yang sama.' }
  }

  const { error: updateError } = await adminClient
    .from('transaksi')
    .update({
      status_transaksi: 'dibatalkan',
      refund_nominal: transaction.total_bayar ?? 0,
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq('id', input.transactionId)

  if (updateError) {
    return { error: `Gagal membatalkan transaksi: ${updateError.message}` }
  }

  revalidatePath('/')
  revalidatePath('/laporan')

  return { success: true }
}
