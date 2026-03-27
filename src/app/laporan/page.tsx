import { checkSupervisorAccess } from '@/utils/supabase/check-admin'
import Sidebar from '@/components/sidebar'
import ReportList from '@/components/report-list'
import { parseReportFilters } from '@/utils/report-params'
import { getReportPageData } from './report-data'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LaporanPage({ searchParams }: PageProps) {
  const session = await checkSupervisorAccess()
  const filters = parseReportFilters((await searchParams) ?? {})
  const { transactions, recapRows, summary, totalItems, totalPages } = await getReportPageData(filters)

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header style={{ marginBottom: '40px' }} className="no-print">
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Laporan Transaksi</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Filter, analisis, dan ekspor data transaksi petugas Anda.</p>
        </header>

        <ReportList
          detailData={transactions}
          recapData={recapRows}
          filters={filters}
          summary={summary}
          totalItems={totalItems}
          totalPages={totalPages}
          canCancelTransaction={session.role !== 'supervisor'}
        />
      </main>
    </div>
  )
}
