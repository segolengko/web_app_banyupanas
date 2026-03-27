'use client'

import { useState } from 'react'
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Loader2, ArrowRight, Sparkles, Ticket } from 'lucide-react'
import { login } from './actions'
import Image from 'next/image'

interface LoginFormProps {
  message?: string
}

export default function LoginForm({ message }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    try {
      await login(formData)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="glass-panel login-form">
      <section className="login-brand">
        <div>
          <div className="hero-badge">
            <ShieldCheck size={16} />
            Admin Control Center
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 18px 30px -20px rgba(0,0,0,0.9)',
              }}
            >
              <Image src="/logo.png" alt="Logo Banyupanas" width={62} height={62} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Banyupanas Ticketing
              </div>
              <h1>Kelola penjualan tiket dengan ritme yang rapi.</h1>
            </div>
          </div>

          <p className="subtitle">
            Dashboard admin ini dirancang untuk memantau penjualan, mengatur hak akses petugas, dan menjaga data operasional tetap bersih dalam satu tempat.
          </p>
        </div>

        <div className="hero-grid">
          <div className="hero-note">
            <h3>Rekap cepat</h3>
            <p>Lihat detail transaksi atau beralih ke rekap harian tanpa memecah alur kerja admin.</p>
          </div>
          <div className="hero-note">
            <h3>Kontrol akses</h3>
            <p>Kelola akun petugas aktif, nonaktif, dan pemutakhiran hak akses dari satu panel.</p>
          </div>
          <div className="hero-note">
            <h3>Siap operasional</h3>
            <p>Harga tiket, profil wisata, dan ekspor laporan dirancang tetap cepat dipakai saat ritme kerja ramai.</p>
          </div>
        </div>
      </section>

      <section className="glass-panel login-form-panel">
        <div>
          <div className="login-mobile-brand">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 18px 30px -20px rgba(0,0,0,0.9)',
              }}
            >
              <Image src="/logo.png" alt="Logo Banyupanas" width={38} height={38} />
            </div>
            <div>
              <div className="login-mobile-brand-label">Banyupanas Ticketing</div>
              <div className="login-mobile-brand-title">Dashboard Admin</div>
            </div>
          </div>

          <div className="eyebrow">
            <Sparkles size={14} />
            Secure Sign In
          </div>
          <h2>Masuk ke dashboard admin</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.8 }}>
            Gunakan akun administrator aktif untuk mengelola tiket, petugas, profil wisata, dan laporan penjualan.
          </p>
        </div>

        <form action={handleSubmit} className="input-container">
          <div className="input-group">
            <label htmlFor="email">Email Admin</label>
            <div className="input-field-wrapper">
              <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="email@banyupanas.com"
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Kata Sandi</label>
            <div className="input-field-wrapper">
              <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi admin"
                style={{ paddingLeft: '48px', paddingRight: '52px' }}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {message && <div className="error-message">{message}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={isPending}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Ticket size={18} />
                Masuk ke Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '13px' }}>
          <span>Keamanan login hanya untuk administrator aktif.</span>
          <span>&copy; 2026 Banyupanas</span>
        </div>
      </section>
    </div>
  )
}
