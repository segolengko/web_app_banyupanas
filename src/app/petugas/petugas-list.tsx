'use client'

import { UserX, UserCheck, Trash2 } from 'lucide-react'
import { toggleStaffStatus, deleteStaff } from './actions'
import type { StaffMember } from '@/types/admin'

interface PetugasListProps {
  staff: StaffMember[]
}

export default function PetugasList({ staff }: PetugasListProps) {
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
    </div>
  )
}
