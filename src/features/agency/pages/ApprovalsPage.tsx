import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { LogoTile } from '@/components/ui/Tiles'
import { useToast } from '@/components/ui/Toast'
import { CheckBadge } from '@/components/agency/CheckBadge'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import { SlaChip } from '@/components/agency/SlaChip'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate, formatNumber, formatRMRange } from '@/lib/format'
import { canWorkQueue } from '@/services/agencyQueues'
import { decideRole, getPendingRoles } from '@/services/roleApprovals'
import { skillById } from '@/services/taxonomy'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

/** Partner role approvals: criteria checklist → approve, or return with a reason. */
export default function ApprovalsPage() {
  const { t, lt, lang } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const [params] = useSearchParams()
  const focus = params.get('role')
  const [returning, setReturning] = useState<string | null>(null)
  const { data } = useAsync(() => getPendingRoles(settings), [settings])
  const canAct = !readOnly && canWorkQueue(role, 'partnerRoleApprovals')
  const tierRule = settings.tierB.partnerRoles === 'hidden' ? t('ag.ra.tierHidden') : t('ag.ra.tierWindow', { days: settings.tierB.earlyAccessDays })

  return (
    <AgencyPage title={t('ag.ra.title')} description={t('ag.ra.lead')}>
      {!canAct && <Note tone="muted" className="mb-4">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      {data && data.length === 0 && (
        <Card>
          <EmptyState title={t('ag.ra.empty')} />
        </Card>
      )}
      <div className="space-y-4">
        {(data ?? []).map((p) => (
          <Card key={p.role.id} as="article" className={focus === p.role.id ? 'outline outline-[1.5px] outline-ink outline-offset-2' : undefined}>
            <div className="flex flex-wrap items-start gap-4">
              <LogoTile monogram={p.partner.monogram} />
              <div className="min-w-0 flex-1">
                <p className="t-subheading">{p.role.title}</p>
                <p className="text-ink-2">
                  {p.partner.name} · <span>{t(`ag.partnerStatus.${p.partner.onboardingStage === 'probation' ? 'probation' : p.partner.status}`)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SlaChip sla={p.sla} />
                <Chip tone="muted" size="sm">
                  {t('ag.ra.posted', { date: formatDate(p.role.postedAt, lang) })}
                </Chip>
              </div>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-2">{t('ag.ra.salary')}</dt>
                  <dd className="tabular">{formatRMRange(p.role.salaryRM)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-2">{t('ag.ra.contract')}</dt>
                  <dd>{t(`role.contract.${p.role.contractType}`)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-2">{t('role.location')}</dt>
                  <dd>{p.role.location}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-ink-2">{t('ag.ra.skills')}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {p.role.requiredSkills.map((s) => (
                      <Chip key={s.skillId} tone="muted" size="sm">
                        {lt(skillById(s.skillId)?.name ?? { en: s.skillId })} · {t(`skill.level.${s.level}`)}
                      </Chip>
                    ))}
                  </dd>
                </div>
              </dl>
              <section className="rounded-control bg-surface-muted p-4">
                <SectionLabel className="mb-3">{t('ag.ra.criteria')}</SectionLabel>
                <ul className="space-y-2">
                  <li>
                    <CheckBadge state={p.criteria.salaryFloor} label={t('ag.ra.salaryFloor', { floor: formatNumber(settings.partners.salaryFloorRM) })} />
                  </li>
                  <li>
                    <CheckBadge state={p.criteria.contractType} label={t('ag.ra.contractType')} />
                  </li>
                  <li>
                    <CheckBadge state={p.criteria.partnerStanding} label={t('ag.ra.partnerStanding')} />
                  </li>
                </ul>
                <p className="mt-3 t-caption font-normal text-ink-2">{t('ag.ra.tierRule', { rule: tierRule })}</p>
              </section>
            </div>

            {canAct && (
              <div className="mt-4 flex justify-end gap-2 border-t border-hairline pt-4">
                <Button variant="secondary" size="sm" onClick={() => setReturning(p.role.id)}>
                  {t('ag.ra.return')}
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    await decideRole(officer, p.role.id, 'approve')
                    toast(t('ag.ra.approved'))
                  }}
                >
                  {t('ag.ra.approve')}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <ReasonDialog
        open={!!returning}
        title={t('ag.ra.return')}
        confirmLabel={t('ag.confirm')}
        presets={[`Salary below the RM ${formatNumber(settings.partners.salaryFloorRM)} floor`, 'Contract roles are not eligible', 'Partner is on probation: resubmit after review']}
        onCancel={() => setReturning(null)}
        onConfirm={async (r) => {
          await decideRole(officer, returning!, 'return', r)
          setReturning(null)
          toast(t('ag.ra.returned'))
        }}
      />
    </AgencyPage>
  )
}
