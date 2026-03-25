'use client'

import { useState } from 'react'
import { UserPlus, User, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { addStaff } from './actions'

export default function AddStaffForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message
    }

    return 'Gagal menambahkan petugas.'
  }

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)
    try {
      await addStaff(formData)
      // Reset form if success (optional, revalidate will happen)
      ;(document.getElementById('add-staff-form') as HTMLFormElement)?.reset()
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <UserPlus size={20} color="var(--primary-color)" />
        Daftarkan Petugas Baru
      </h3>
      <form id="add-staff-form" action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label style={{ fontSize: '13px' }}>Nama Lengkap Petugas</label>
          <div className="input-field-wrapper">
            <User size={16} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input name="nama" placeholder="Misal: Ahmad Rifai" style={{ paddingLeft: '44px' }} required />
          </div>
        </div>
        <div className="input-group">
          <label style={{ fontSize: '13px' }}>Email (untuk Login)</label>
          <div className="input-field-wrapper">
            <Mail size={16} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input name="email" type="email" placeholder="ahmad@banyupanas.com" style={{ paddingLeft: '44px' }} required />
          </div>
        </div>
        <div className="input-group">
          <label style={{ fontSize: '13px' }}>Password Awal</label>
          <div className="input-field-wrapper">
            <Lock size={16} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input name="password" type="text" placeholder="12345678" style={{ paddingLeft: '44px' }} required />
          </div>
        </div>
        
        {error && (
            <div style={{ color: '#fca5a5', fontSize: '13px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                Error: {error}
            </div>
        )}

        <button type="submit" className="btn-primary" style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }} disabled={isPending}>
          {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mendaftarkan...
              </>
          ) : (
              'Simpan & Buat Akun'
          )}
        </button>
      </form>

      <div className="glass-panel" style={{ marginTop: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.03)', border: '1px dashed var(--primary-glow)', display: 'flex', gap: '12px' }}>
        <ShieldCheck size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Petugas yang didaftarkan bisa langsung login ke aplikasi mobile menggunakan Email dan Password di atas.
        </p>
      </div>
    </div>
  )
}
