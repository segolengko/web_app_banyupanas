'use client'

import { FormEvent, useState, useTransition } from 'react'
import { KeyRound, UserX, UserCheck, Trash2 } from 'lucide-react'
import { toggleStaffStatus, deleteStaff, resetStaffPassword } from './actions'
import type { StaffMember } from '@/types/admin'

interface PetugasListProps {
  staff: StaffMember[]
}

export default function PetugasList({ staff }: PetugasListProps) {
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message
    }

    return 'Terjadi kesalahan yang tidak diketahui.'
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus petugas "${name}" secara permanen? Akun login juga akan dihapus.`)) {
      try {
        await deleteStaff(id)
      } catch (error: unknown) {
        alert('Gagal menghapus: ' + getErrorMessage(error))
      }
    }
  }

  const openResetModal = (staffMember: StaffMember) => {
    setResetTarget(staffMember)
    setNewPassword('')
    setConfirmPassword('')
    setResetError(null)
  }

  const closeResetModal = () => {
    if (isPending) {
      return
    }

    setResetTarget(null)
    setNewPassword('')
    setConfirmPassword('')
    setResetError(null)
  }

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!resetTarget) {
      return
    }

    if (newPassword.trim().length < 6) {
      setResetError('Password baru minimal 6 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetError('Konfirmasi password tidak sama.')
      return
    }

    setResetError(null)

    startTransition(async () => {
      try {
        await resetStaffPassword(resetTarget.id, newPassword)
        closeResetModal()
      } catch (error: unknown) {
        setResetError(getErrorMessage(error))
      }
    })
  }

  return (
    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Petugas</th>
            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Email</th>
            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
            <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {staff?.map((p) => (
            <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
              <td style={{ padding: '20px', fontWeight: '500' }}>{p.nama_lengkap}</td>
              <td style={{ padding: '20px', color: 'var(--text-muted)' }}>{p.email}</td>
              <td style={{ padding: '20px' }}>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: p.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: p.is_active ? '#4ade80' : '#f87171',
                    border: `1px solid ${p.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  }}
                >
                  {p.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td style={{ padding: '20px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <form action={() => toggleStaffStatus(p.id, p.is_active)}>
                    <button
                      type="submit"
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                      }}
                      title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {p.is_active ? <UserX size={18} color="#fca5a5" /> : <UserCheck size={18} color="#86efac" />}
                    </button>
                  </form>
                  <button
                    onClick={() => openResetModal(p)}
                    style={{
                      background: 'rgba(45, 212, 191, 0.12)',
                      border: '1px solid rgba(45, 212, 191, 0.25)',
                      color: '#99f6e4',
                      padding: '8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                    title="Reset Password"
                  >
                    <KeyRound size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.nama_lengkap)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#fca5a5',
                      padding: '8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                    title="Hapus Permanen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {staff?.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Belum ada petugas yang terdaftar.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {resetTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.72)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 1000,
          backdropFilter: 'blur(6px)',
        }}>
          <div className="glass-panel" style={{ width: 'min(100%, 480px)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px' }}>Reset Password Petugas</h3>
                <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Password untuk <strong>{resetTarget.nama_lengkap}</strong> akan diganti langsung dari dashboard admin.
                </p>
              </div>
              <button
                type="button"
                onClick={closeResetModal}
                disabled={isPending}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '24px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: '16px' }}>
              <div className="input-group">
                <label>Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>

              <div className="input-group">
                <label>Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Ulangi password baru"
                  required
                />
              </div>

              {resetError && (
                <div className="error-message" style={{ marginBottom: 0 }}>
                  {resetError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={closeResetModal}
                  disabled={isPending}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    background: 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '12px 16px' }} disabled={isPending}>
                  {isPending ? 'Menyimpan...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
