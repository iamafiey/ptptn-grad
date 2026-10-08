import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import type { ChangeRequest } from '@/services/db'
import { getOfficerById } from '@/services/demo'
import { approveChange, listChanges, rejectChange } from '@/services/governance'
import type { Officer } from '@/types/domain'
import { ReasonDialog } from './ReasonDialog'

const TONE: Record<ChangeRequest['status'], ChipTone> = { pendingApproval: 'pending', published: 'done', rejected: 'muted' }

/** Change requests under the two-person rule: the drafter can't approve their own change. */
export function ChangeRequestList({ kind, officer, canAct, onApproved }: { kind: ChangeRequest['kind']; officer: Officer; canAct: boolean; onApproved: (cr: ChangeRequest) => void }) {
  const { t, lang } = useT()
  const { data } = useAsync(() => listChanges(), [])
  const [rejecting, setRejecting] = useState<string | null>(null)
  const rows = (data ?? []).filter((c) => c.kind === kind)
  const name = (id?: string) => (id ? (getOfficerById(id)?.name ?? id) : '')

  return (
    <section>
      <SectionLabel className="mb-3">{t('ai.rb.history')}</SectionLabel>
      {rows.length === 0 ? (
        <Card>
          <p className="t-body-sm text-ink-2">{t('ai.rb.none')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <Card key={c.id} as="article">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-body-strong">{c.title}</p>
                  <p className="t-caption font-normal text-ink-3">
                    {c.id} · {t('ai.rb.drafter', { name: name(c.drafter) })} · {formatDate(c.createdAt, lang, 'long')}
                    {c.approver && c.status === 'published' && ` · ${t('ai.rb.approver', { name: name(c.approver) })}`}
                    {c.effectiveAt && c.status === 'published' && ` · ${t('ti.scheduled', { date: formatDate(c.effectiveAt, lang, 'long') })}`}
                  </p>
                </div>
                <Chip tone={TONE[c.status]} size="sm">
                  {t(`ai.cr.status.${c.status}`)}
                </Chip>
              </div>
              {c.detail && <p className="mt-2 t-body-sm text-ink-2">{c.detail}</p>}
              {c.status === 'pendingApproval' &&
                canAct &&
                (c.drafter === officer.id ? (
                  <Note tone="muted" icon={<Users size={14} strokeWidth={1.5} />} className="mt-3">
                    {t('ai.rb.selfBlocked')}
                  </Note>
                ) : (
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setRejecting(c.id)}>
                      {t('ai.rb.reject')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        const cr = await approveChange(officer, c.id)
                        onApproved(cr)
                      }}
                    >
                      {t('ai.rb.approve')}
                    </Button>
                  </div>
                ))}
            </Card>
          ))}
        </div>
      )}
      <ReasonDialog
        open={!!rejecting}
        title={t('ai.rb.reject')}
        confirmLabel={t('ag.confirm')}
        presets={['Impact too large for this cycle', 'Needs a fairness review first']}
        onCancel={() => setRejecting(null)}
        onConfirm={async (r) => {
          await rejectChange(officer, rejecting!, r)
          setRejecting(null)
        }}
      />
    </section>
  )
}
