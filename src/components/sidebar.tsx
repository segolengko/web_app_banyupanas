import { LogOut, Orbit, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import SidebarNav from './sidebar-nav'
import { checkSupervisorAccess } from '@/utils/supabase/check-admin'

export default async function Sidebar() {
  const session = await checkSupervisorAccess()
  const supabase = await createClient()
  const { data: wisataProfile } = await supabase
    .from('profil_wisata')
    .select('logo_url')
    .eq('id', 1)
    .single<{ logo_url: string | null }>()

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <aside className="sidebar">
      <form action={signOut} className="admin-logout-top">
        <button type="submit" className="nav-link logout-btn admin-logout-top-btn" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={18} />
          Keluar
        </button>
      </form>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: '0 16px 30px -18px rgba(0,0,0,0.82)',
          }}>
            {wisataProfile?.logo_url ? (
              <div
                aria-label="Logo Wisata"
                style={{
                  width: '100%',
                  height: '100%',
                  background: `center / contain no-repeat url(${wisataProfile.logo_url})`,
                }}
              />
            ) : (
              <Image src="/logo.png" alt="Logo" width={32} height={32} />
            )}
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ticketing Admin
            </div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: '700', margin: '4px 0 0', letterSpacing: '-0.04em' }}>
              Banyupanas
            </h2>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '22px',
            background: 'linear-gradient(180deg, rgba(45, 212, 191, 0.12), rgba(45, 212, 191, 0.04))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              <ShieldCheck size={18} color="#99f6e4" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#dffcf7', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Admin Workspace
            </div>
          </div>
          <p style={{ margin: 0, color: 'var(--text-soft)', fontSize: '13px', lineHeight: '1.65' }}>
            Pantau penjualan, atur hak akses petugas, dan rapikan data operasional dari satu dashboard yang lebih tenang dipakai.
          </p>
        </div>
      </div>

      <SidebarNav role={session.role} />

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '18px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <Orbit size={16} color="var(--primary-color)" />
        Sistem siap dipakai
      </div>
    </aside>
  )
}
