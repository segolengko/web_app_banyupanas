import { checkAdminAccess } from '@/utils/supabase/check-admin'
import Sidebar from '@/components/sidebar'
import { revalidatePath } from 'next/cache'
import { Save, Info } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function ProfileWisataPage() {
  await checkAdminAccess()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profil_wisata')
    .select('*')
    .eq('id', 1)
    .single()

  async function updateProfile(formData: FormData) {
    'use server'
    await checkAdminAccess()
    const supabase = await createClient()
    const updates = {
      nama_wisata: formData.get('nama') as string,
      logo_url: (formData.get('logo_url') as string) || null,
      alamat: formData.get('alamat') as string,
      no_telepon: formData.get('telp') as string,
      pesan_struk: formData.get('pesan') as string,
      updated_at: new Date().toISOString(),
    }

    await supabase.from('profil_wisata').update(updates).eq('id', 1)
    revalidatePath('/profile-wisata')
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Profil Obyek Wisata</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Identitas tempat wisata untuk struk fisik.</p>
        </header>

        <div className="glass-panel" style={{ maxWidth: '800px', padding: '48px' }}>
           <form action={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="input-group">
                    <label>Nama Wisata</label>
                    <input name="nama" defaultValue={profile?.nama_wisata} required />
                </div>
                <div className="input-group">
                    <label>Nomor Telepon</label>
                    <input name="telp" defaultValue={profile?.no_telepon} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 180px', gap: '24px', alignItems: 'start' }}>
                <div className="input-group">
                  <label>Logo URL</label>
                  <input
                    name="logo_url"
                    defaultValue={profile?.logo_url ?? ''}
                    placeholder="https://domain-kamu/logo-banyupanas.png"
                  />
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Gunakan URL gambar publik. Logo ini dipakai untuk identitas aplikasi admin dan bisa dipakai juga untuk kebutuhan struk berikutnya.
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Preview Logo</label>
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '18px',
                      border: '1px solid var(--border-color)',
                      background: profile?.logo_url
                        ? `rgba(255,255,255,0.04) url(${profile.logo_url}) center/contain no-repeat`
                        : 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '16px',
                    }}
                  >
                    {!profile?.logo_url ? 'Belum ada logo' : null}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Alamat Lengkap</label>
                <input name="alamat" defaultValue={profile?.alamat} required />
              </div>

              <div className="input-group">
                <label>Pesan Kaki Struk (Footer)</label>
                <textarea 
                    name="pesan" 
                    defaultValue={profile?.pesan_struk} 
                    rows={4}
                    style={{
                        padding: '16px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '14px',
                        color: 'white',
                        fontFamily: 'inherit',
                        fontSize: '16px'
                    }}
                />
              </div>

              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.03)', border: '1px dashed var(--primary-glow)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <Info size={24} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Informasi ini akan dicetak otomatis di bagian paling atas (Kop) dan paling bawah (Footer) pada setiap struk tiket yang dicetak oleh petugas melalui aplikasi mobile.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ padding: '16px 48px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Save size={20} />
                  Simpan Perubahan
                </button>
              </div>
            </form>
        </div>
      </main>
    </div>
  )
}
