import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { Note } from '@/components/ui/Note'
import { useToast } from '@/components/ui/Toast'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import type { OverrideRequest } from '@/data/agency6'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { expireOverride, grantOverride, listOverrides, rejectOverride } from '@/services/tiersAdmin'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const TONE: Record<OverrideRequest['status'], ChipTone> = { pending: 'pending', active: 'done', expired: 'muted', rejected: 'muted' }

/** Tier overrides: restore Tier A for a fixed period while proof of payment waits for sync. */
export default function OverridesPage() {
  const { t, lang } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const { data } = useAsync(() => listOverrides(), [])
  const [pending, setPending] = useState<{ id: string; kind: 'grant' | 'reject' } | null>(null)
  const canAct = !readOnly && (role === 'collectionLiaison' || role === 'superAdmin')
  const days = settings.tier.overrideDays

  return (
    <AgencyPage title={t('agency.nav.overrides')} description={t('ti.ov.lead')}>
      {!canAct && <Note tone="muted" className="mb-4">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      <div className="space-y-3">
        {(data ?? []).map((o) => (
          <Card key={o.id} as="article">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="t-body-strong">
                  {o.id} · <span className="tabular">{o.studentCode}</span>
                  {o.studentId && (
                    <Chip tone="info" size="sm" className="ml-2" icon={<UserRound size={11} strokeWidth={1.5} />}>
                      demo
                    </Chip>
                  )}
                </p>
                <p className="t-body-sm text-ink-2">
                  {t('ti.ov.proof')}: {o.proof}
                </p>
                <p className="t-body-sm text-ink-2">{o.note}</p>
                <p className="mt-1 t-caption font-normal text-ink-3">
                  {t('ti.ov.requested', { date: formatDate(o.requestedAt, lang, 'long') })}
                  {o.expiresAt && ` · ${t('ti.ov.expires', { date: formatDate(o.expiresAt, lang, 'long') })}`}
                </p>
              </div>
              <Chip tone={TONE[o.status]} size="sm">
                {t(`ti.ov.status.${o.status}`)}
              </Chip>
            </div>
            {o.studentId && o.status === 'pending' && <p className="mt-2 t-caption font-normal text-ink-3">{t('ti.ov.demo')}</p>}
            {canAct && o.status === 'pending' && (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPending({ id: o.id, kind: 'reject' })}>
                  {t('ti.ov.reject')}
                </Button>
                <Button size="sm" onClick={() => setPending({ id: o.id, kind: 'grant' })}>
                  {t('ti.ov.grant', { days })}
                </Button>
              </div>
            )}
            {canAct && o.status === 'active' && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={async () => {
                    await expireOverride(officer, o.id)
                    toast(t('ag.done'))
                  }}
                >
                  {t('ti.ov.expire')}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <ReasonDialog
        open={!!pending}
        title={pending?.kind === 'grant' ? t('ti.ov.grant', { days }) : t('ti.ov.reject')}
        confirmLabel={t('ag.confirm')}
        presets={pending?.kind === 'grant' ? ['Bank receipt checked against reference', 'Salary deduction confirmed by employer'] : ['Proof does not match the account', 'Receipt is unreadable']}
        onCancel={() => setPending(null)}
        onConfirm={async (r) => {
          if (!pending) return
          if (pending.kind === 'grant') {
            await grantOverride(officer, pending.id, settings, r)
            toast(t('ti.ov.granted', { days }))
          } else {
            await rejectOverride(officer, pending.id, r)
            toast(t('ag.done'))
          }
          setPending(null)
        }}
      />
    </AgencyPage>
  )
}
