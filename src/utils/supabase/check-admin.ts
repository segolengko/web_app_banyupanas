import { redirect } from 'next/navigation'
import { createClient } from './server'

export type BackofficeRole = 'super_admin' | 'admin' | 'supervisor' | 'petugas'

type BackofficeProfile = {
  role: BackofficeRole
  is_active: boolean
}

export type BackofficeSession = {
  userId: string
  role: BackofficeRole
}

export const SUPER_ADMIN_ROLES: BackofficeRole[] = ['super_admin']
export const ADMIN_ROLES: BackofficeRole[] = ['super_admin', 'admin']
export const SUPERVISOR_ROLES: BackofficeRole[] = ['super_admin', 'admin', 'supervisor']

export function hasAllowedRole(role: string | null | undefined, allowedRoles: BackofficeRole[]) {
  return typeof role === 'string' && allowedRoles.includes(role as BackofficeRole)
}

async function requireBackofficeAccess(allowedRoles: BackofficeRole[], deniedMessage: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('role, is_active')
    .eq('id', user.id)
    .single<BackofficeProfile>()

  if (!profile || !hasAllowedRole(profile.role, allowedRoles)) {
    await supabase.auth.signOut()
    redirect(`/login?message=${encodeURIComponent(deniedMessage)}`)
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?message=Akun Anda sedang nonaktif. Silakan hubungi pengelola sistem.')
  }

  return {
    userId: user.id,
    role: profile.role,
  } satisfies BackofficeSession
}

export async function checkSuperAdminAccess() {
  return requireBackofficeAccess(
    SUPER_ADMIN_ROLES,
    'Akses Ditolak: Dashboard ini hanya untuk Super Admin.'
  )
}

export async function checkAdminAccess() {
  return requireBackofficeAccess(
    ADMIN_ROLES,
    'Akses Ditolak: Dashboard ini hanya untuk Admin atau Super Admin.'
  )
}

export async function checkSupervisorAccess() {
  return requireBackofficeAccess(
    SUPERVISOR_ROLES,
    'Akses Ditolak: Dashboard ini hanya untuk Supervisor, Admin, atau Super Admin.'
  )
}
