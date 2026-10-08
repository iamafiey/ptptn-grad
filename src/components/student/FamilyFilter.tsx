import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { familyThumb, type JobFamily } from '@/services/jobFamily'

/** Scrollable picture chips to narrow a list by job family. */
export function FamilyFilter({ counts, value, onChange }: { counts: Partial<Record<JobFamily, number>>; value: JobFamily | 'all'; onChange: (v: JobFamily | 'all') => void }) {
  const { t } = useT()
  const total = Object.values(counts).reduce((n, c) => n + (c ?? 0), 0)
  const items = (Object.entries(counts) as [JobFamily, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  const chip = (id: JobFamily | 'all', label: string, n: number) => (
    <button
      key={id}
      type="button"
      aria-pressed={value === id}
      onClick={() => onChange(id)}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-control border pl-1.5 pr-3 t-caption transition-colors',
        value === id ? 'border-ink bg-ink text-on-ink' : 'border-hairline bg-surface text-ink hover:bg-surface-muted',
        id === 'all' && 'pl-3',
      )}
    >
      {id !== 'all' && <img src={familyThumb(id)} alt="" className="h-7 w-7 rounded-chip" />}
      <span className="whitespace-nowrap">{label}</span>
      <span className={cn('tabular', value === id ? 'text-on-ink/70' : 'text-ink-3')}>{n}</span>
    </button>
  )
  return (
    <div role="group" aria-label={t('family.filter')} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chip('all', t('family.all'), total)}
      {items.map(([id, n]) => chip(id, t(`family.${id}`), n))}
    </div>
  )
}
