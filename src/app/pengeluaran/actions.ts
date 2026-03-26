'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAccess } from '@/utils/supabase/check-admin'
import { createAdminClient } from '@/utils/supabase/admin'

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function createExpenseAction(formData: FormData) {
  const user = await checkAdminAccess()

  const expenseDate = getString(formData, 'expenseDate')
  const category = getString(formData, 'category')
  const description = getString(formData, 'description')
  const paymentMethod = getString(formData, 'paymentMethod')
  const nominal = Number.parseInt(getString(formData, 'nominal'), 10)

  if (!expenseDate) {
    throw new Error('Tanggal pengeluaran wajib diisi.')
  }

  if (!category) {
    throw new Error('Kategori pengeluaran wajib diisi.')
  }

  if (!Number.isFinite(nominal) || nominal <= 0) {
    throw new Error('Nominal pengeluaran tidak valid.')
  }

  const adminClient = createAdminClient()
  const expenseAt = new Date(`${expenseDate}T12:00:00.000Z`).toISOString()

  const { error } = await adminClient
    .from('operational_expenses')
    .insert({
      expense_at: expenseAt,
      nominal,
      category,
      description: description || null,
      payment_method: paymentMethod || 'tunai',
      created_by: user.userId,
    })

  if (error) {
    throw new Error(`Gagal menyimpan pengeluaran: ${error.message}`)
  }

  revalidatePath('/pengeluaran')
  revalidatePath('/laporan')
  revalidatePath('/')
}

export async function deleteExpenseAction(formData: FormData) {
  await checkAdminAccess()

  const expenseId = getString(formData, 'expenseId')

  if (!expenseId) {
    throw new Error('ID pengeluaran tidak ditemukan.')
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('operational_expenses')
    .delete()
    .eq('id', expenseId)

  if (error) {
    throw new Error(`Gagal menghapus pengeluaran: ${error.message}`)
  }

  revalidatePath('/pengeluaran')
  revalidatePath('/laporan')
  revalidatePath('/')
}

export async function updateExpenseAction(formData: FormData) {
  await checkAdminAccess()

  const expenseId = getString(formData, 'expenseId')
  const expenseDate = getString(formData, 'expenseDate')
  const category = getString(formData, 'category')
  const description = getString(formData, 'description')
  const paymentMethod = getString(formData, 'paymentMethod')
  const nominal = Number.parseInt(getString(formData, 'nominal'), 10)

  if (!expenseId) {
    throw new Error('ID pengeluaran tidak ditemukan.')
  }

  if (!expenseDate) {
    throw new Error('Tanggal pengeluaran wajib diisi.')
  }

  if (!category) {
    throw new Error('Kategori pengeluaran wajib diisi.')
  }

  if (!Number.isFinite(nominal) || nominal <= 0) {
    throw new Error('Nominal pengeluaran tidak valid.')
  }

  const adminClient = createAdminClient()
  const expenseAt = new Date(`${expenseDate}T12:00:00.000Z`).toISOString()

  const { error } = await adminClient
    .from('operational_expenses')
    .update({
      expense_at: expenseAt,
      nominal,
      category,
      description: description || null,
      payment_method: paymentMethod || 'tunai',
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId)

  if (error) {
    throw new Error(`Gagal memperbarui pengeluaran: ${error.message}`)
  }

  revalidatePath('/pengeluaran')
  revalidatePath('/laporan')
  revalidatePath('/')
}
