import { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { MatchRing } from '@/components/ui/Rings'
import { Sheet } from '@/components/ui/Sheet'
import { LogoTile } from '@/components/ui/Tiles'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n'
import { formatDate, formatRMRange } from '@/lib/format'
import { applyOnPortal, type OpenJobView } from '@/services/jobs'
import { skillById } from '@/services/taxonomy'

/** Open job from a portal feed. Applying links out; the click becomes a pending log entry. */
export function JobSheet({ job, studentId, open, onClose, onLogged }: { job: OpenJobView | null; studentId: string; open: boolean; onClose: () => void; onLogged?: (entryId: string) => void }) {
  const { t, lt, lang } = useT()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  if (!job) return null

  const apply = async () => {
    setBusy(true)
    const res = await applyOnPortal(studentId, job.id)
    setBusy(false)
    // The portals are fictional, so we don't navigate away; a real build would open res.url.
    onClose()
    toast(t('job.logged'))
    onLogged?.(res.entryId)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={job.title}
      closeLabel={t('action.close')}
      footer={
        <Button block loading={busy} icon={<ExternalLink size={16} strokeWidth={1.5} />} onClick={apply}>
          {t('job.applyOn', { portal: job.portal.name })}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <LogoTile monogram={job.portal.monogram} />
          <div className="min-w-0 flex-1">
            <p className="t-body-strong">{job.company}</p>
            <p className="flex items-center gap-1 t-caption font-normal text-ink-2">
              <MapPin size={14} strokeWidth={1.5} aria-hidden /> {job.location} · {job.portal.name}
            </p>
          </div>
          <MatchRing pct={job.matchPct} label={t('role.match', { pct: job.matchPct })} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.salaryRM && (
            <Chip tone="muted" size="sm">
              <span className="tabular">{formatRMRange(job.salaryRM)}</span>
            </Chip>
          )}
          <Chip tone="outline" size="sm">
            {t('opp.open.posted', { date: formatDate(job.postedAt, lang) })}
          </Chip>
        </div>
        <section>
          <p className="mb-2 t-label text-ink-2">{t('job.skills')}</p>
          <div className="flex flex-wrap gap-1.5">
            {job.skillIds.map((s) => (
              <Chip key={s} tone="muted" size="sm">
                {lt(skillById(s)?.name ?? { en: s })}
              </Chip>
            ))}
          </div>
        </section>
        <p className="t-body text-ink-2">{t('job.applyNote', { portal: job.portal.name })}</p>
      </div>
    </Sheet>
  )
}
