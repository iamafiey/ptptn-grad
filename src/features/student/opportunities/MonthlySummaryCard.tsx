import { motion, useReducedMotion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useT } from '@/i18n'
import type { MonthlyJobSearchSummary } from '@/types/domain'

/** Logged / verified / under review this month, with progress toward the active job-seeking threshold. */
export function MonthlySummaryCard({ summary, title, action }: { summary: MonthlyJobSearchSummary; title: string; action?: React.ReactNode }) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const pct = Math.min(100, (summary.verified / Math.max(1, summary.threshold)) * 100)
  const stats: [string, number][] = [
    [t('home.jobsearch.logged'), summary.logged],
    [t('home.jobsearch.verified'), summary.verified],
    [t('home.jobsearch.review'), summary.underReview],
  ]
  return (
    <Card>
      <SectionLabel action={action}>{title}</SectionLabel>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dd className="t-heading tabular">
              <AnimatedNumber value={v} />
            </dd>
            <dt className="t-caption font-normal text-ink-2">{k}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-4 h-1.5 overflow-hidden rounded-sm bg-hairline" role="progressbar" aria-valuemin={0} aria-valuemax={summary.threshold} aria-valuenow={summary.verified}>
        <motion.div className="h-full bg-ink" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: reduce ? 0 : 0.4 }} />
      </div>
      <p className="mt-2 t-caption font-normal text-ink-2">{summary.met ? t('home.jobsearch.met') : t('home.jobsearch.progress', { verified: summary.verified, threshold: summary.threshold })}</p>
    </Card>
  )
}
