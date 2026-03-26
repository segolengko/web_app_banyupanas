import type { ReportFilters } from '@/types/admin'

type SearchParamRecord = Record<string, string | string[] | undefined>

export const REPORT_PAGE_SIZE = 10

function readValue(
  source: URLSearchParams | SearchParamRecord,
  key: keyof ReportFilters | 'page'
) {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? ''
  }

  const value = source[key]

  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

export function parseReportFilters(source: URLSearchParams | SearchParamRecord): ReportFilters {
  const pageValue = Number.parseInt(readValue(source, 'page'), 10)
  const statusValue = readValue(source, 'status')

  return {
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    mode: readValue(source, 'mode') === 'rekap' ? 'rekap' : 'detail',
    searchTerm: readValue(source, 'searchTerm').trim(),
    startDate: readValue(source, 'startDate'),
    endDate: readValue(source, 'endDate'),
    status: statusValue === 'selesai' || statusValue === 'dibatalkan' ? statusValue : 'semua',
  }
}

export function createReportSearchParams(filters: Partial<ReportFilters>) {
  const params = new URLSearchParams()

  if (filters.mode === 'rekap') {
    params.set('mode', filters.mode)
  }

  if (filters.searchTerm) {
    params.set('searchTerm', filters.searchTerm)
  }

  if (filters.startDate) {
    params.set('startDate', filters.startDate)
  }

  if (filters.endDate) {
    params.set('endDate', filters.endDate)
  }

  if (filters.status && filters.status !== 'semua') {
    params.set('status', filters.status)
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page))
  }

  return params
}

export function getReportRange(page: number) {
  const from = (page - 1) * REPORT_PAGE_SIZE
  const to = from + REPORT_PAGE_SIZE - 1

  return { from, to }
}

export function getStartDateIso(startDate: string) {
  return `${startDate}T00:00:00.000Z`
}

export function getEndDateExclusiveIso(endDate: string) {
  const date = new Date(`${endDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString()
}

export function sanitizeSearchTerm(searchTerm: string) {
  return searchTerm.replace(/[,%()]/g, ' ').trim()
}
