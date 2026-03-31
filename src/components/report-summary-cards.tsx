'use client'

import { Banknote, Ban, CircleDollarSign, CreditCard, Ticket, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ReportSummary } from '@/types/admin'
import { formatCurrency } from '@/utils/reporting'

type ReportSummaryCardsProps = {
  summary: ReportSummary
}

export default function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  return (
    <div
      className="no-print"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
      }}
    >
      <SummaryCard title="Pendapatan Tiket Bersih" value={formatCurrency(summary.revenue)} icon={<Banknote size={24} />} color="#10B981" />
      <SummaryCard title="Tiket Valid" value={`${summary.tickets} Tiket`} icon={<Ticket size={24} />} color="#6366F1" />
      <SummaryCard title="Total Diskon" value={formatCurrency(summary.discount)} icon={<CreditCard size={24} />} color="#FB7185" isNegative={summary.discount > 0} />
      <SummaryCard title="Total Refund" value={formatCurrency(summary.refund)} icon={<CircleDollarSign size={24} />} color="#F87171" isNegative={summary.refund > 0} />
      <SummaryCard title="Total Pengeluaran" value={formatCurrency(summary.expenses)} icon={<Wallet size={24} />} color="#F59E0B" isNegative={summary.expenses > 0} />
      <SummaryCard title="Saldo Bersih" value={formatCurrency(summary.netRevenue)} icon={<Banknote size={24} />} color="#22C55E" isNegative={summary.netRevenue < 0} />
      <SummaryCard title="Transaksi Batal" value={`${summary.cancelledCount} Transaksi`} icon={<Ban size={24} />} color="#F59E0B" />
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  color,
  isNegative = false,
}: {
  title: string
  value: string
  icon: ReactNode
  color: string
  isNegative?: boolean
}) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: `2px solid ${color}` }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px', fontWeight: '500' }}>{title}</p>
        <h4 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: isNegative && value !== 'Rp 0' && value !== '-Rp 0' ? '#F87171' : 'white' }}>{value}</h4>
      </div>
    </div>
  )
}
