'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkSuperAdminAccess } from '@/utils/supabase/check-admin'
import type { ManagedUserRole } from '@/types/admin'

const ALLOWED_ROLES: ManagedUserRole[] = ['super_admin', 'admin', 'supervisor', 'petugas']

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function getRole(value: string): ManagedUserRole {
  if (ALLOWED_ROLES.includes(value as ManagedUserRole)) {
    return value as ManagedUserRole
  }

  throw new Error('Role user tidak valid.')
}

export async function addUser(formData: FormData) {
  await checkSuperAdminAccess()
  const adminAuth = createAdminClient()

  const email = getString(formData, 'email')
  const password = getString(formData, 'password')
  const nama = getString(formData, 'nama')
  const role = getRole(getString(formData, 'role'))

  if (!email || !password || !nama) {
    throw new Error('Nama, email, dan password wajib diisi.')
  }

  if (password.length < 6) {
    throw new Error('Password minimal 6 karakter.')
  }

  const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama_lengkap: nama },
  })

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Gagal membuat akun auth.')
  }

  const { error: profileError } = await adminAuth
    .from('users_profile')
    .insert([{
      id: authData.user.id,
      email,
      nama_lengkap: nama,
      role,
      is_active: true,
    }])

  if (profileError) {
    await adminAuth.auth.admin.deleteUser(authData.user.id)
    throw new Error(profileError.message)
  }

  revalidatePath('/users')
}

export async function deleteUserAccount(id: string) {
  const session = await checkSuperAdminAccess()

  if (!id) {
    throw new Error('ID user tidak ditemukan.')
  }

  if (id === session.userId) {
    throw new Error('Super admin tidak bisa menghapus akun sendiri.')
  }

  const adminAuth = createAdminClient()
  const { error } = await adminAuth.auth.admin.deleteUser(id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/users')
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
  const session = await checkSuperAdminAccess()

  if (!id) {
    throw new Error('ID user tidak ditemukan.')
  }

  if (id === session.userId && currentStatus) {
    throw new Error('Super admin tidak bisa menonaktifkan akun sendiri.')
  }

  const adminAuth = createAdminClient()
  const { error } = await adminAuth
    .from('users_profile')
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/users')
}

export async function updateUserRole(id: string, roleValue: string) {
  const session = await checkSuperAdminAccess()
  const role = getRole(roleValue)

  if (!id) {
    throw new Error('ID user tidak ditemukan.')
  }

  if (id === session.userId && role !== 'super_admin') {
    throw new Error('Super admin tidak bisa menurunkan role akun sendiri.')
  }

  const adminAuth = createAdminClient()
  const { error } = await adminAuth
    .from('users_profile')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/users')
}

export async function resetUserPassword(id: string, nextPassword: string) {
  const session = await checkSuperAdminAccess()
  const password = nextPassword.trim()

  if (!id) {
    throw new Error('ID user tidak ditemukan.')
  }

  if (password.length < 6) {
    throw new Error('Password baru minimal 6 karakter.')
  }

  if (id === session.userId && password.length < 6) {
    throw new Error('Password baru tidak valid.')
  }

  const adminAuth = createAdminClient()
  const { error } = await adminAuth.auth.admin.updateUserById(id, {
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/users')
}
