'use client'

import { FormEvent, useState, useTransition } from 'react'
import { KeyRound, Save, Trash2, UserCheck, UserX } from 'lucide-react'
import { deleteUserAccount, resetUserPassword, toggleUserStatus, updateUserRole } from './actions'
import type { ManagedUser, ManagedUserRole } from '@/types/admin'

type UserListProps = {
  users: ManagedUser[]
  currentUserId: string
}

const ROLE_OPTIONS: Array<{ value: ManagedUserRole; label: string }> = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'petugas', label: 'Petugas' },
]

export default function UserList({ users, currentUserId }: UserListProps) {
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null)
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

  const openResetModal = (user: ManagedUser) => {
    setResetTarget(user)
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

  const handleDelete = async (user: ManagedUser) => {
    if (confirm(`Hapus user "${user.nama_lengkap}" secara permanen? Akun login juga akan dihapus.`)) {
      try {
        await deleteUserAccount(user.id)
      } catch (error: unknown) {
        alert(`Gagal menghapus: ${getErrorMessage(error)}`)
      }
    }
  }

  const handleRoleUpdate = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role)
    } catch (error: unknown) {
      alert(`Gagal mengubah role: ${getErrorMessage(error)}`)
    }
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
        await resetUserPassword(resetTarget.id, newPassword)
        closeResetModal()
      } catch (error: unknown) {
        setResetError(getErrorMessage(error))
      }
    })
  }

  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Nama</th>
              <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Role</th>
              <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '20px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 600 }}>{user.nama_lengkap}</div>
                  {user.id === currentUserId && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Akun saat ini</div>
                  )}
                </td>
                <td style={{ padding: '20px', color: 'var(--text-muted)' }}>{user.email}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="role-select"
                      defaultValue={user.role}
                      onChange={(event) => handleRoleUpdate(user.id, event.target.value)}
                      disabled={user.id === currentUserId}
                      style={{
                        padding: '10px 12px',
                        minWidth: '170px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      <Save size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      auto
                    </span>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: user.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: user.is_active ? '#4ade80' : '#f87171',
                      border: `1px solid ${user.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    }}
                  >
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td style={{ padding: '20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <form action={() => toggleUserStatus(user.id, user.is_active)}>
                      <button
                        type="submit"
                        disabled={user.id === currentUserId && user.is_active}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          color: 'white',
                          padding: '8px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          opacity: user.id === currentUserId && user.is_active ? 0.45 : 1,
                        }}
                        title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {user.is_active ? <UserX size={18} color="#fca5a5" /> : <UserCheck size={18} color="#86efac" />}
                      </button>
                    </form>
                    <button
                      onClick={() => openResetModal(user)}
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
                      onClick={() => handleDelete(user)}
                      disabled={user.id === currentUserId}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        padding: '8px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        opacity: user.id === currentUserId ? 0.45 : 1,
                      }}
                      title="Hapus Permanen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Belum ada user yang terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                <h3 style={{ margin: 0, fontSize: '22px' }}>Reset Password User</h3>
                <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Password untuk <strong>{resetTarget.nama_lengkap}</strong> akan diganti langsung dari dashboard.
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
