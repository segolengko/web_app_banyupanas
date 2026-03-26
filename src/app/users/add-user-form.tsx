'use client'

import { useState } from 'react'
import { Loader2, Lock, Mail, ShieldCheck, User, UserPlus } from 'lucide-react'
import { addUser } from './actions'
import type { ManagedUserRole } from '@/types/admin'

const ROLE_OPTIONS: Array<{ value: ManagedUserRole; label: string }> = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'petugas', label: 'Petugas' },
]

export default function AddUserForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getErrorMessage = (cause: unknown) => {
    if (cause instanceof Error) {
      return cause.message
    }

    return 'Gagal membuat user baru.'
  }

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)

    try {
      await addUser(formData)
      ;(document.getElementById('add-user-form') as HTMLFormElement | null)?.reset()
    } catch (cause: unknown) {
      setError(getErrorMessage(cause))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <UserPlus size={20} color="var(--primary-color)" />
        Tambah User Baru
      </h3>

      <form id="add-user-form" action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label style={{ fontSize: '13px' }}>Nama Lengkap</label>
          <div className="input-field-wrapper">
            <User size={16} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input name="nama" placeholder="Misal: Rani Kusuma" style={{ paddingLeft: '44px' }} required />
          </div>
        </div>

        <div className="input-group">
          <label style={{ fontSize: '13px' }}>Email Login</label>
          <div className="input-field-wrapper">
            <Mail size={16} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input name="email" type="email" placeholder="rani@banyupanas.com" style={{ paddingLeft: '44px' }} required />
          </div>
        </div>

        <div className="input-group">
          <label style={{ fontSize: '13px' }}>Role</label>
          <select name="role" defaultValue="admin" required className="role-select">
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label style={{ fontSize: '13px' }}>Password Awal</label>
          <div className="input-field-wrapper">
            <Lock size={16} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input name="password" type="text" placeholder="Minimal 6 karakter" style={{ paddingLeft: '44px' }} required />
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
              Menyimpan...
            </>
          ) : (
            'Simpan & Buat Akun'
          )}
        </button>
      </form>

      <div className="glass-panel" style={{ marginTop: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.03)', border: '1px dashed var(--primary-glow)', display: 'flex', gap: '12px' }}>
        <ShieldCheck size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Modul ini khusus super admin. User baru akan langsung bisa login sesuai role yang dipilih.
        </p>
      </div>
    </div>
  )
}
