import { ArrowRight, Calendar, Sparkles, Ticket, TrendingUp, Users } from 'lucide-react'
import { checkAdminAccess } from '@/utils/supabase/check-admin'
import Sidebar from '@/components/sidebar'
import { createClient } from '@/utils/supabase/server'

export default async function Dashboard() {
  await checkAdminAccess()
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const { data: transactions } = await supabase
    .from('transaksi')
    .select('total_bayar, total_tiket')
    .gte('created_at', todayIso)

  const { count: activeStaffCount } = await supabase
    .from('users_profile')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'petugas')
    .eq('is_active', true)

  const totalRevenue = transactions?.reduce((sum, transaction) => sum + (transaction.total_bayar || 0), 0) || 0
  const totalTickets = transactions?.reduce((sum, transaction) => sum + (transaction.total_tiket || 0), 0) || 0
  const transactionCount = transactions?.length || 0

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <section className="glass-panel hero-panel">
          <div>
            <div className="hero-badge">
              <Sparkles size={15} />
              Operasional Hari Ini
            </div>
            <h1 className="hero-title">Panel admin yang lebih segar untuk memantau ritme penjualan Banyupanas.</h1>
            <p className="hero-copy">
              Semua fungsi inti tetap sama, tapi tampilan sekarang dibuat lebih fokus untuk membaca angka penjualan, menjaga akses petugas, dan bergerak cepat saat admin perlu mengambil keputusan.
            </p>

            <div className="hero-grid">
              <div className="hero-note">
                <h3>Agenda utama</h3>
                <p>Pastikan harga tiket tetap akurat, akun petugas aktif, dan laporan selalu siap diekspor kapan pun dibutuhkan.</p>
              </div>
              <div className="hero-note">
                <h3>Tanggal operasional</h3>
                <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="section-grid">
            <div className="glass-panel" style={{ padding: '22px', borderRadius: '24px', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.14), rgba(245, 158, 11, 0.05))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <Calendar size={20} color="#fde68a" />
                </div>
                <div>
                  <div style={{ color: '#fde68a', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Snapshot
                  </div>
                  <div style={{ fontSize: '20px', fontFamily: 'Sora, sans-serif', marginTop: '4px' }}>Hari operasional aktif</div>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--text-soft)', lineHeight: 1.7, fontSize: '14px' }}>
                Pantau overview penjualan hari ini sebelum masuk ke detail laporan atau melakukan pembaruan tiket dan akses petugas.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div className="hero-note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Petugas Aktif
                  </div>
                  <div style={{ fontSize: '28px', fontFamily: 'Sora, sans-serif', marginTop: '6px' }}>
                    {(activeStaffCount ?? 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <ArrowRight size={18} color="var(--primary-color)" />
              </div>
              <div className="hero-note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Transaksi Hari Ini
                  </div>
                  <div style={{ fontSize: '28px', fontFamily: 'Sora, sans-serif', marginTop: '6px' }}>
                    {transactionCount.toLocaleString('id-ID')}
                  </div>
                </div>
                <ArrowRight size={18} color="var(--accent-color)" />
              </div>
            </div>
          </div>
        </section>

        <section className="stat-grid">
          <article className="glass-panel stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Total Pendapatan</div>
                <div className="stat-value">Rp {totalRevenue.toLocaleString('id-ID')}</div>
              </div>
              <div className="stat-icon">
                <TrendingUp size={24} color="var(--primary-color)" />
              </div>
            </div>
            <div className="stat-foot">
              <Sparkles size={14} color="#6ee7b7" />
              Ringkasan pemasukan dari seluruh transaksi hari ini
            </div>
          </article>

          <article className="glass-panel stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Tiket Terjual</div>
                <div className="stat-value">{totalTickets.toLocaleString('id-ID')}</div>
              </div>
              <div className="stat-icon">
                <Ticket size={24} color="#fbbf24" />
              </div>
            </div>
            <div className="stat-foot">
              <Ticket size={14} color="#fde68a" />
              Akumulasi tiket yang tercatat dari aplikasi petugas
            </div>
          </article>

          <article className="glass-panel stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Petugas Online</div>
                <div className="stat-value">{(activeStaffCount ?? 0).toLocaleString('id-ID')}</div>
              </div>
              <div className="stat-icon">
                <Users size={24} color="#93c5fd" />
              </div>
            </div>
            <div className="stat-foot">
              <Users size={14} color="#93c5fd" />
              Jumlah akun petugas aktif yang siap dipakai operasional
            </div>
          </article>
        </section>

        <section className="glass-panel" style={{ marginTop: '26px', padding: '30px' }}>
          <div className="page-header" style={{ marginBottom: '0' }}>
            <div>
              <h1 style={{ fontSize: '28px' }}>Arah kerja admin hari ini</h1>
              <p>
                Jalur kerja paling aman adalah memperbarui harga tiket bila perlu, memastikan akun petugas yang bertugas tetap aktif, lalu menutup hari dengan rekap transaksi yang siap diekspor.
              </p>
            </div>
          </div>
          <div className="hero-grid" style={{ marginTop: '12px' }}>
            <div className="hero-note">
              <h3>1. Validasi harga tiket</h3>
              <p>Cek kategori yang aktif dan koreksi harga jika ada perubahan operasional atau promosi khusus.</p>
            </div>
            <div className="hero-note">
              <h3>2. Jaga akses petugas</h3>
              <p>Pastikan petugas yang bertugas hari ini tetap aktif, sementara akun yang tidak dipakai bisa dinonaktifkan dulu.</p>
            </div>
            <div className="hero-note">
              <h3>3. Ekspor saat dibutuhkan</h3>
              <p>Gunakan mode detail atau rekap harian sesuai kebutuhan admin, lalu export Excel untuk analisis lanjutan.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
