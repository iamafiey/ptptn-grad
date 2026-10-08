import { AlertTriangle, Check, CircleDashed, X } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { CHECK_STAGES } from '@/services/evidenceCheck'
import type { Check as CheckState, EvidenceCheckResult } from '@/types/domain'

/** Live stage list while the AI checks evidence. */
export function CheckProgress({ stage }: { stage: number }) {
  const { lt, t } = useT()
  return (
    <div>
      <p className="t-body-strong" role="status">
        {t('log.checking')}
      </p>
      <ol className="mt-4 space-y-3">
        {CHECK_STAGES.map((s, i) => (
          <li key={s.key} className={cn('flex items-center gap-3 t-body transition-opacity', i > stage && 'opacity-40')}>
            <span className={cn('grid h-7 w-7 place-items-center rounded-control', i < stage ? 'bg-done text-done-ink' : i === stage ? 'bg-ink text-on-ink' : 'bg-surface-muted text-ink-3')}>
              {i < stage ? <Check size={14} strokeWidth={2} /> : <CircleDashed size={14} strokeWidth={1.5} className={i === stage ? 'animate-spin' : ''} />}
            </span>
            {lt(s.label)}
          </li>
        ))}
      </ol>
    </div>
  )
}

const ICON: Record<CheckState, React.ReactNode> = {
  pass: <Check size={14} strokeWidth={2} />,
  warn: <AlertTriangle size={14} strokeWidth={1.5} />,
  fail: <X size={14} strokeWidth={2} />,
  pending: <CircleDashed size={14} strokeWidth={1.5} />,
}
const TONE: Record<CheckState, string> = { pass: 'bg-done text-done-ink', warn: 'bg-pending text-pending-ink', fail: 'bg-attention text-attention-ink', pending: 'bg-surface-muted text-ink-2' }

/** Explainability: what the AI extracted, each check, confidence and model version. */
export function CheckDetails({ result }: { result: EvidenceCheckResult }) {
  const { t, lt, lang } = useT()
  const ex = result.extracted
  const rows: [string, string | undefined][] = [
    [t('log.company'), ex.company],
    [t('log.role'), ex.role],
    [t('log.portalName'), ex.portal],
    [t('log.date'), ex.date && formatDate(ex.date, lang, 'long')],
  ]
  return (
    <div className="space-y-5">
      {result.reasons.length > 0 && (
        <ul className="space-y-1">
          {result.reasons.map((r, i) => (
            <li key={i} className="t-body text-ink">
              {lt(r)}
            </li>
          ))}
        </ul>
      )}
      <section>
        <p className="mb-2 t-label text-ink-2">{t('log.extracted')}</p>
        <dl className="divide-y divide-hairline rounded-control bg-surface-muted px-3">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2 t-caption">
              <dt className="text-ink-2">{k}</dt>
              <dd className="text-right text-ink">{v ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="t-label text-ink-2">{t('log.checks')}</p>
          <Chip tone="muted" size="sm">
            {t('log.confidence', { pct: Math.round(result.confidence * 100) })}
          </Chip>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {(Object.entries(result.checks) as [keyof EvidenceCheckResult['checks'], CheckState][]).map(([k, v]) => (
            <li key={k} className="flex items-center gap-2 t-caption">
              <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-chip', TONE[v])}>{ICON[v]}</span>
              {t(`log.check.${k}`)}
            </li>
          ))}
        </ul>
        <p className="mt-3 t-micro text-ink-3">{result.modelVersion}</p>
      </section>
    </div>
  )
}
