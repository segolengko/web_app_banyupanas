import { checkSuperAdminAccess } from '@/utils/supabase/check-admin'
import Sidebar from '@/components/sidebar'
import AddStaffForm from './add-staff-form'
import PetugasList from './petugas-list'
import { createClient } from '@/utils/supabase/server'
import type { StaffMember } from '@/types/admin'

export default async function PetugasPage() {
  await checkSuperAdminAccess()
  const supabase = await createClient()

  const { data: staff } = await supabase
    .from('users_profile')
    .select('*')
    .eq('role', 'petugas')
    .order('created_at', { ascending: false })

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Manajemen Petugas Tiket</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Kelola akun login dan status akses petugas di lapangan.</p>
        </header>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '32px', alignItems: 'start' }}>
            <PetugasList staff={(staff ?? []) as StaffMember[]} />
            <AddStaffForm />
        </div>
      </main>
    </div>
  )
}
