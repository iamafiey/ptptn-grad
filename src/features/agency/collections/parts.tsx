import { Chip } from '@/components/ui/Chip'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { HISTORY_MONTHS, type Borrower, type PayMark } from '@/services/collections'
import { RISK_TONE } from '../tones'

// Shared pieces for the Collections pages.

export function RiskChip({ b, withScore = true }: { b: Borrower; withScore?: boolean }) {
  const { t } = useT()
  return (
    <Chip tone={RISK_TONE[b.risk.level]} size="sm">
      {t(`col.risk.${b.risk.level}`)}
      {withScore && <span className="tabular"> · {b.risk.score}</span>}
    </Chip>
  )
}

const MARK: Record<PayMark, string> = { paid: 'bg-done', partial: 'bg-pending', missed: 'bg-attention', grace: 'bg-hairline' }

/** Twelve months of payments as a strip of cells; colour plus a legend and per-cell labels. */
export function PaymentStrip({ history }: { history: PayMark[] }) {
  const { t, lang } = useT()
  const month = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-MY', { month: 'short', timeZone: 'UTC' })
  return (
    <div>
      <ol className="grid grid-cols-12 gap-1" aria-label={t('col.rec.history')}>
        {history.map((m, i) => (
          <li key={HISTORY_MONTHS[i]} className="min-w-0 text-center" title={`${HISTORY_MONTHS[i]} · ${t(`col.pay.${m}`)}`}>
            <span className={cn('block h-6 rounded-chip', MARK[m])} aria-hidden />
            <span className="mt-1 block truncate t-micro text-ink-3">{month(HISTORY_MONTHS[i])}</span>
            <span className="sr-only">{t(`col.pay.${m}`)}</span>
          </li>
        ))}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 t-caption text-ink-2">
        {(['paid', 'partial', 'missed', 'grace'] as PayMark[]).map((m) => (
          <li key={m} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-chip', MARK[m])} aria-hidden />
            {t(`col.pay.${m}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}
