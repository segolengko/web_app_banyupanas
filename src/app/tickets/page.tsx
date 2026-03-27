import { checkAdminAccess } from '@/utils/supabase/check-admin'
import Sidebar from '@/components/sidebar'
import { revalidatePath } from 'next/cache'
import { PencilLine, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import CurrencyInput from '@/components/currency-input'

type TicketCategory = {
  id: number
  nama_kategori: string
  harga_dasar: number
  is_active: boolean
}

export default async function TicketsPage() {
  await checkAdminAccess()
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('kategori_tiket')
    .select('*')
    .order('id', { ascending: true })

  async function addCategory(formData: FormData) {
    'use server'
    await checkAdminAccess()
    const supabase = await createClient()
    const nama = formData.get('nama') as string
    const harga = parseInt(formData.get('harga') as string)

    await supabase.from('kategori_tiket').insert([{ 
        nama_kategori: nama, 
        harga_dasar: harga,
        is_active: true 
    }])
    revalidatePath('/tickets')
  }

  async function updateCategory(formData: FormData) {
    'use server'
    await checkAdminAccess()
    const supabase = await createClient()
    const id = Number.parseInt(formData.get('id') as string, 10)
    const nama = formData.get('nama') as string
    const harga = Number.parseInt(formData.get('harga') as string, 10)

    await supabase
      .from('kategori_tiket')
      .update({
        nama_kategori: nama,
        harga_dasar: harga,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    revalidatePath('/tickets')
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Kelola Harga Tiket</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Atur daftar kategori dan harga tiket masuk.</p>
        </header>
        
        <div className="tickets-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '32px', alignItems: 'start' }}>
            {/* List Table */}
            <div className="glass-panel tickets-list-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="tickets-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Nama Kategori</th>
                            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Harga Dasar</th>
                            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
                            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(categories as TicketCategory[] | null)?.map((cat) => {
                        const formId = `ticket-category-${cat.id}`

                        return (
                        <tr key={cat.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '20px' }}>
                                <input
                                    form={formId}
                                    name="nama"
                                    defaultValue={cat.nama_kategori}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '10px',
                                        color: 'white',
                                    }}
                                    required
                                />
                            </td>
                            <td style={{ padding: '20px' }}>
                                <CurrencyInput
                                    form={formId}
                                    name="harga"
                                    defaultValue={cat.harga_dasar}
                                    required
                                    width="140px"
                                />
                            </td>
                            <td style={{ padding: '20px' }}>
                                <span style={{ 
                                    padding: '6px 12px', 
                                    borderRadius: '20px', 
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: cat.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: cat.is_active ? '#4ade80' : '#f87171',
                                    border: `1px solid ${cat.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}>
                                    {cat.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                                    <form id={formId} action={updateCategory}>
                                        <input type="hidden" name="id" value={cat.id} />
                                    </form>
                                    <button
                                        type="submit"
                                        form={formId}
                                        className="btn-primary"
                                        style={{
                                            padding: '10px 14px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <Save size={16} />
                                        Update
                                    </button>
                                    <form action={async () => {
                                        'use server'
                                        await checkAdminAccess()
                                        const supabase = await createClient()
                                        await supabase.from('kategori_tiket').update({ is_active: !cat.is_active }).eq('id', cat.id)
                                        revalidatePath('/tickets')
                                    }}>
                                        <button type="submit" style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            color: cat.is_active ? '#fca5a5' : '#86efac',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>
                                            {cat.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        )})}
                    </tbody>
                </table>
                </div>

                <div className="tickets-mobile-list">
                  {(categories as TicketCategory[] | null)?.map((cat) => {
                    const formId = `ticket-category-mobile-${cat.id}`

                    return (
                      <article key={cat.id} className="tickets-mobile-card">
                        <div className="tickets-mobile-card-head">
                          <div>
                            <div className="tickets-mobile-name">{cat.nama_kategori}</div>
                            <div className={`tickets-mobile-status ${cat.is_active ? 'active' : 'inactive'}`}>
                              {cat.is_active ? 'Aktif' : 'Nonaktif'}
                            </div>
                          </div>
                          <div className="tickets-mobile-price">Rp {cat.harga_dasar.toLocaleString('id-ID')}</div>
                        </div>

                        <form id={formId} action={updateCategory} className="tickets-mobile-form">
                          <input type="hidden" name="id" value={cat.id} />
                          <div className="input-group">
                            <label style={{ fontSize: '13px' }}>Nama Kategori</label>
                            <input
                              name="nama"
                              defaultValue={cat.nama_kategori}
                              required
                            />
                          </div>
                          <div className="input-group">
                            <label style={{ fontSize: '13px' }}>Harga Dasar (Rp)</label>
                            <CurrencyInput
                              name="harga"
                              defaultValue={cat.harga_dasar}
                              required
                            />
                          </div>
                        </form>

                        <div className="tickets-mobile-actions">
                          <button
                            type="submit"
                            form={formId}
                            className="btn-primary"
                            style={{ padding: '12px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                          >
                            <Save size={16} />
                            Update
                          </button>
                          <form action={async () => {
                            'use server'
                            await checkAdminAccess()
                            const supabase = await createClient()
                            await supabase.from('kategori_tiket').update({ is_active: !cat.is_active }).eq('id', cat.id)
                            revalidatePath('/tickets')
                          }}>
                            <button type="submit" className={`tickets-mobile-toggle ${cat.is_active ? 'inactive' : 'active'}`}>
                              {cat.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                              {cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          </form>
                        </div>
                      </article>
                    )
                  })}
                </div>
            </div>

            {/* Sidebar Form */}
            <div className="glass-panel tickets-form-panel" style={{ padding: '28px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PencilLine size={20} color="var(--primary-color)" />
                    Tambah atau Koreksi
                </h3>
                <p style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                    Harga dan nama kategori bisa langsung dikoreksi dari tabel di sebelah kiri. Form ini dipakai untuk menambah kategori baru.
                </p>
                <form action={addCategory} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-group">
                        <label style={{ fontSize: '13px' }}>Nama Kategori</label>
                        <input name="nama" placeholder="Misal: Tiket Anak" required />
                    </div>
                    <div className="input-group">
                        <label style={{ fontSize: '13px' }}>Harga Dasar (Rp)</label>
                        <CurrencyInput name="harga" placeholder="15.000" required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '14px' }}>
                        Simpan Kategori
                    </button>
                </form>
            </div>
        </div>
      </main>
    </div>
  )
}
