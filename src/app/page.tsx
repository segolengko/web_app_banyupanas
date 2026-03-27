import { ArrowRight, Calendar, ReceiptText, Sparkles, Tag, Ticket, TrendingUp } from 'lucide-react'
import { checkSupervisorAccess } from '@/utils/supabase/check-admin'
import Sidebar from '@/components/sidebar'
import { createClient } from '@/utils/supabase/server'
import DashboardRefresh from '@/components/dashboard-refresh'

export default async function Dashboard() {
  await checkSupervisorAccess()
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const { data: transactions } = await supabase
    .from('transaksi')
    .select('total_bayar, total_tiket, status_transaksi, refund_nominal, diskon_nominal')
    .gte('created_at', todayIso)

  const { data: expenses } = await supabase
    .from('operational_expenses')
    .select('nominal')
    .gte('expense_at', todayIso)

  const totalRevenue = transactions?.reduce((sum, transaction) => (
    transaction.status_transaksi === 'dibatalkan' ? sum : sum + (transaction.total_bayar || 0)
  ), 0) || 0
  const totalTickets = transactions?.reduce((sum, transaction) => (
    transaction.status_transaksi === 'dibatalkan' ? sum : sum + (transaction.total_tiket || 0)
  ), 0) || 0
  const totalDiscount = transactions?.reduce((sum, transaction) => (
    transaction.status_transaksi === 'dibatalkan' ? sum : sum + (transaction.diskon_nominal || 0)
  ), 0) || 0
  const totalRefund = transactions?.reduce((sum, transaction) => (
    transaction.status_transaksi === 'dibatalkan'
      ? sum + (transaction.refund_nominal || transaction.total_bayar || 0)
      : sum
  ), 0) || 0
  const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.nominal || 0), 0) || 0
  const transactionCount = transactions?.length || 0

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <section className="dashboard-refresh-bar">
          <DashboardRefresh intervalSeconds={90} />
        </section>

        <section className="glass-panel hero-panel dashboard-hero-section">
          <div>
            <div className="hero-badge">
              <Calendar size={15} />
              Operasional Hari Ini
            </div>
            <h1 className="hero-title">Ringkasan operasional hari ini.</h1>
            <p className="hero-copy">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="section-grid">
            <div style={{ display: 'grid', gap: '14px' }}>
              <div className="hero-note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Total Pengeluaran
                  </div>
                  <div style={{ fontSize: '28px', fontFamily: 'Sora, sans-serif', marginTop: '6px' }}>
                    Rp {totalExpenses.toLocaleString('id-ID')}
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

        <section className="stat-grid dashboard-stats-section">
          <article className="glass-panel stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Pendapatan Bersih Hari Ini</div>
                <div className="stat-value">Rp {totalRevenue.toLocaleString('id-ID')}</div>
              </div>
              <div className="stat-icon">
                <TrendingUp size={24} color="var(--primary-color)" />
              </div>
            </div>
            <div className="stat-foot">
              <Sparkles size={14} color="#6ee7b7" />
              Tidak menghitung transaksi yang sudah dibatalkan
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
                <div className="stat-label">Total Diskon Hari Ini</div>
                <div className="stat-value">Rp {totalDiscount.toLocaleString('id-ID')}</div>
              </div>
              <div className="stat-icon">
                <Tag size={24} color="#93c5fd" />
              </div>
            </div>
            <div className="stat-foot">
              <Tag size={14} color="#93c5fd" />
              Akumulasi diskon transaksi valid sepanjang hari ini
            </div>
          </article>

          <article className="glass-panel stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Total Pengeluaran Hari Ini</div>
                <div className="stat-value">Rp {totalExpenses.toLocaleString('id-ID')}</div>
              </div>
              <div className="stat-icon">
                <ReceiptText size={24} color="#f87171" />
              </div>
            </div>
            <div className="stat-foot">
              <ReceiptText size={14} color="#fca5a5" />
              Total biaya operasional yang sudah dicatat untuk hari ini
            </div>
          </article>
        </section>

        <section className="glass-panel dashboard-guidance-section" style={{ marginTop: '26px', padding: '30px' }}>
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
