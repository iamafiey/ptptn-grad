import type { MoneyRangeRM } from '@/types/domain'

const nf = new Intl.NumberFormat('en-MY', { maximumFractionDigits: 0 })

export const formatRM = (n: number) => `RM ${nf.format(n)}`
export const formatRMRange = (r: MoneyRangeRM) => `RM ${nf.format(r.min)} – ${nf.format(r.max)}`
export const formatNumber = (n: number) => nf.format(n)

type DateStyle = 'short' | 'weekday' | 'long' | 'month' | 'mon'

/** Localised dates: short "9 Oct", weekday "Fri, 9 Oct", long "9 Oct 2026", month "October 2026". */
export function formatDate(iso: string, lang: 'en' | 'ms', style: DateStyle = 'short') {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso)
  const locale = lang === 'ms' ? 'ms-MY' : 'en-MY'
  const opts: Intl.DateTimeFormatOptions =
    style === 'weekday'
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : style === 'long'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : style === 'month'
          ? { month: 'long', year: 'numeric' }
          : style === 'mon'
            ? { month: 'short', year: '2-digit' }
          : { day: 'numeric', month: 'short' }
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'Asia/Kuala_Lumpur' }).format(d)
}
