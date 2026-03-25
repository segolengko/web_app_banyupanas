import { createClient } from './server'
import { redirect } from 'next/navigation'

type AdminProfile = {
  role: string
  is_active: boolean
}

export async function checkAdminAccess() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile and check role
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role, is_active')
    .eq('id', user.id)
    .single<AdminProfile>()

  if (!profile || profile.role !== 'admin') {
    // If not admin, sign out and redirect
    await supabase.auth.signOut()
    redirect('/login?message=Akses Ditolak: Dashboard ini hanya untuk Administrator.')
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?message=Akun admin Anda sedang nonaktif. Silakan hubungi pengelola sistem.')
  }

  return user
}
