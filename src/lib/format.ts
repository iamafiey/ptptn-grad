import type { MoneyRangeRM } from '@/types/domain'

const nf = new Intl.NumberFormat('en-MY', { maximumFractionDigits: 0 })

export const formatRM = (n: number) => `RM ${nf.format(n)}`
export const formatRMRange = (r: MoneyRangeRM) => `RM ${nf.format(r.min)} – ${nf.format(r.max)}`
export const formatNumber = (n: number) => nf.format(n)
