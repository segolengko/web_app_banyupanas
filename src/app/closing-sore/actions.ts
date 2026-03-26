'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAccess } from '@/utils/supabase/check-admin'
import { createAdminClient } from '@/utils/supabase/admin'

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function getNumber(formData: FormData, key: string) {
  const value = Number.parseInt(getString(formData, key), 10)
  return Number.isFinite(value) ? value : 0
}

export async function saveClosingAction(formData: FormData) {
  const user = await checkAdminAccess()

  const closingDate = getString(formData, 'closingDate')

  if (!closingDate) {
    throw new Error('Tanggal closing wajib diisi.')
  }

  const payload = {
    closing_date: closingDate,
    total_transactions: getNumber(formData, 'totalTransactions'),
    total_tickets: getNumber(formData, 'totalTickets'),
    gross_revenue: getNumber(formData, 'grossRevenue'),
    total_discount: getNumber(formData, 'totalDiscount'),
    total_refund: getNumber(formData, 'totalRefund'),
    total_expenses: getNumber(formData, 'totalExpenses'),
    net_revenue: getNumber(formData, 'netRevenue'),
    notes: getString(formData, 'notes') || null,
    closed_by: user.userId,
    closed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('cash_closings')
    .upsert(payload, { onConflict: 'closing_date' })

  if (error) {
    throw new Error(`Gagal menyimpan closing sore: ${error.message}`)
  }

  revalidatePath('/closing-sore')
}
