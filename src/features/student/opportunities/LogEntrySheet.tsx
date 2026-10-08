import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Note } from '@/components/ui/Note'
import { Sheet } from '@/components/ui/Sheet'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { updateOutcome, type LogEntryView } from '@/services/jobLog'
import type { LogOutcome } from '@/types/domain'
import { CheckDetails } from './EvidenceCheck'
import { statusOf } from './logStatus'

const OUTCOMES: LogOutcome[] = ['applied', 'interview', 'offer', 'hired', 'closed']

/** One log entry: evidence, AI check explainability, outcome updates, re-upload. */
export function LogEntrySheet({ entry, studentId, open, onClose, onAddEvidence }: { entry: LogEntryView | null; studentId: string; open: boolean; onClose: () => void; onAddEvidence: (id: string) => void }) {
  const { t, lt, lang } = useT()
  if (!entry) return null
  const st = statusOf(entry.status)
  const needsEvidence = entry.status === 'pendingEvidence' || entry.status === 'rejected'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={entry.role}
      closeLabel={t('action.close')}
      footer={
        needsEvidence ? (
          <Button block onClick={() => onAddEvidence(entry.id)}>
            {entry.status === 'rejected' ? t('log.reupload') : t('log.addEvidence')}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div>
          <p className="t-body-strong">{entry.company}</p>
          <p className="t-caption font-normal text-ink-2">{t('log.appliedOn', { date: formatDate(entry.appliedAt, lang, 'long'), portal: entry.portalName })}</p>
          <Chip tone={st.tone} size="sm" className="mt-2">
            {t(st.key)}
          </Chip>
        </div>
        {entry.evidence && <img src={entry.evidence.previewUrl} alt={entry.evidence.fileName} className="max-h-56 w-full rounded-card border border-hairline bg-surface-muted object-contain" />}
        {entry.rejectionReason && <Note tone="attention">{lt(entry.rejectionReason)}</Note>}
        {entry.check && <CheckDetails result={entry.check} />}
        <section>
          <p className="mb-2 t-label text-ink-2">{t('log.outcome')}</p>
          <ChipSelect<LogOutcome> label={t('log.outcome')} value={[entry.outcome]} onChange={(v) => updateOutcome(studentId, entry.id, v[0])} options={OUTCOMES.map((o) => ({ value: o, label: t(`log.outcome.${o}`) }))} />
        </section>
      </div>
    </Sheet>
  )
}
