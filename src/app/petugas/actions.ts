'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { checkSuperAdminAccess } from '@/utils/supabase/check-admin'
import { revalidatePath } from 'next/cache'

export async function addStaff(formData: FormData) {
  await checkSuperAdminAccess()
  const adminAuth = createAdminClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nama = formData.get('nama') as string

  // 1. Create User in Auth
  const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama_lengkap: nama }
  })

  if (authError) {
    throw new Error(authError.message)
  }

  // 2. Create Profile
  const { error: profileError } = await adminAuth
    .from('users_profile')
    .insert([{
      id: authData.user.id,
      email,
      nama_lengkap: nama,
      role: 'petugas',
      is_active: true
    }])

  if (profileError) {
    // Cleanup auth user if profile fails
    await adminAuth.auth.admin.deleteUser(authData.user.id)
    throw new Error(profileError.message)
  }

  revalidatePath('/petugas')
}

export async function deleteStaff(id: string) {
  await checkSuperAdminAccess()
  const adminAuth = createAdminClient()
  
  // Deleting auth user will cascade to profile
  const { error } = await adminAuth.auth.admin.deleteUser(id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/petugas')
}

export async function toggleStaffStatus(id: string, currentStatus: boolean) {
    await checkSuperAdminAccess()
    const adminAuth = createAdminClient()
    await adminAuth.from('users_profile').update({ is_active: !currentStatus }).eq('id', id)
    revalidatePath('/petugas')
}

export async function resetStaffPassword(id: string, nextPassword: string) {
  await checkSuperAdminAccess()

  const password = nextPassword.trim()

  if (!id) {
    throw new Error('ID petugas tidak ditemukan.')
  }

  if (password.length < 6) {
    throw new Error('Password baru minimal 6 karakter.')
  }

  const adminAuth = createAdminClient()
  const { error } = await adminAuth.auth.admin.updateUserById(id, {
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/petugas')
}
