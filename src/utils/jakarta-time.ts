export const JAKARTA_TIME_ZONE = 'Asia/Jakarta'

type DateLike = string | Date

function toDate(value: DateLike) {
  return typeof value === 'string' ? new Date(value) : value
}

function parseDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    throw new Error(`Invalid date value: ${value}`)
  }

  return { year, month, day }
}

export function getJakartaDateKey(value: DateLike) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(toDate(value))
}

export function getJakartaTodayDate() {
  return getJakartaDateKey(new Date())
}

export function formatJakartaDateTime(value: DateLike) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(toDate(value))
}

export function formatJakartaDate(value: DateLike) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(toDate(value))
}

export function formatJakartaLongDate(value: DateLike) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(toDate(value))
}

export function formatJakartaDateFromKey(dateKey: string) {
  const { year, month, day } = parseDateParts(dateKey)
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 0, 0, 0)))
}

export function getJakartaStartDateIso(dateValue: string) {
  const { year, month, day } = parseDateParts(dateValue)
  return new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0)).toISOString()
}

export function getJakartaEndDateExclusiveIso(dateValue: string) {
  const { year, month, day } = parseDateParts(dateValue)
  return new Date(Date.UTC(year, month - 1, day + 1, -7, 0, 0, 0)).toISOString()
}
