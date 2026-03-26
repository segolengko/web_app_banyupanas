import Sidebar from '@/components/sidebar'
import type { ManagedUser } from '@/types/admin'
import { createClient } from '@/utils/supabase/server'
import { checkSuperAdminAccess } from '@/utils/supabase/check-admin'
import AddUserForm from './add-user-form'
import UserList from './user-list'

export default async function UsersPage() {
  const session = await checkSuperAdminAccess()
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users_profile')
    .select('id, nama_lengkap, email, role, is_active')
    .order('created_at', { ascending: false })

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Manajemen User</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Super admin mengelola akun, role, status aktif, dan reset password seluruh user backoffice.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '32px', alignItems: 'start' }}>
          <UserList users={(users ?? []) as ManagedUser[]} currentUserId={session.userId} />
          <AddUserForm />
        </div>
      </main>
    </div>
  )
}
