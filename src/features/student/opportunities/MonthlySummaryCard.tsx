import { CheckCircle2, Clock, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { ProgressRing } from '@/components/ui/Rings'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useT } from '@/i18n'
import type { MonthlyJobSearchSummary } from '@/types/domain'

/** Verified applications as a ring toward the threshold, with logged / verified / under review as icon stats. */
export function MonthlySummaryCard({ summary, title, action }: { summary: MonthlyJobSearchSummary; title: string; action?: React.ReactNode }) {
  const { t } = useT()
  const pct = Math.min(100, (summary.verified / Math.max(1, summary.threshold)) * 100)
  const stats = [
    { icon: <FileText size={14} strokeWidth={1.5} />, label: t('home.jobsearch.logged'), value: summary.logged },
    { icon: <CheckCircle2 size={14} strokeWidth={1.5} />, label: t('home.jobsearch.verified'), value: summary.verified },
    { icon: <Clock size={14} strokeWidth={1.5} />, label: t('home.jobsearch.review'), value: summary.underReview },
  ]
  return (
    <Card>
      <SectionLabel action={action}>{title}</SectionLabel>
      <div className="mt-3 flex items-center gap-4">
        <ProgressRing value={pct} size={72} stroke={6} label={t('home.jobsearch.progress', { verified: summary.verified, threshold: summary.threshold })}>
          <span className="t-body-strong tabular">
            <AnimatedNumber value={summary.verified} />
            <span className="text-ink-2">/{summary.threshold}</span>
          </span>
        </ProgressRing>
        <dl className="grid min-w-0 flex-1 grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <dd className="flex items-center gap-1 t-heading tabular">
                <AnimatedNumber value={s.value} />
              </dd>
              <dt className="flex items-center gap-1 truncate t-caption font-normal text-ink-2">
                <span aria-hidden className="shrink-0">{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </dt>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-3 t-caption font-normal text-ink-2">{summary.met ? t('home.jobsearch.met') : t('home.jobsearch.progress', { verified: summary.verified, threshold: summary.threshold })}</p>
    </Card>
  )
}
