import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Textarea } from '@/components/ui/Textarea'
import { LogoTile } from '@/components/ui/Tiles'
import { useToast } from '@/components/ui/Toast'
import { CheckBadge } from '@/components/agency/CheckBadge'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, formatRM, formatRMRange } from '@/lib/format'
import { addPartnerNote, getPartner, setPartnerStatus } from '@/services/partnersAdmin'
import type { TalentPartner } from '@/types/domain'
import { partnerStatusKey, STATUS_TONE } from '../tones'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const STAGES: TalentPartner['onboardingStage'][] = ['outreach', 'verification', 'workspace', 'probation', 'complete']
type Pending = 'paused' | 'ended' | null

/** Partner record: onboarding stage, verification, agreement, performance, roles and notes. Pause / End / Renew. */
export default function PartnerRecordPage() {
  const { partnerId = '' } = useParams()
  const { t, lang } = useT()
  const toast = useToast()
  const { officer, role, readOnly } = useOfficer()
  const { data, loading } = useAsync(() => getPartner(partnerId), [partnerId])
  const [pending, setPending] = useState<Pending>(null)
  const [note, setNote] = useState('')
  const canAct = !readOnly && (role === 'partnershipManager' || role === 'superAdmin')

  if (!data)
    return (
      <AgencyPage title={t('agency.page.partner')}>
        <Card>{!loading && <EmptyState title={t('ag.empty')} />}</Card>
      </AgencyPage>
    )

  const p = data.partner
  const sk = partnerStatusKey(p)
  const stageIdx = STAGES.indexOf(p.onboardingStage)

  const change = async (status: Pending | 'active' | 'renew', reason?: string) => {
    if (!status) return
    await setPartnerStatus(officer, p.id, status, reason)
    setPending(null)
    toast(t('ag.done'))
  }

  return (
    <AgencyPage
      title={p.name}
      description={`${p.sector} · ${p.hq}`}
      actions={
        canAct && (
          <>
            {p.status === 'active' && (
              <Button variant="secondary" size="sm" onClick={() => setPending('paused')}>
                {t('pa.pause')}
              </Button>
            )}
            {p.status === 'paused' && (
              <Button variant="secondary" size="sm" onClick={() => change('active')}>
                {t('pa.reactivate')}
              </Button>
            )}
            {p.status !== 'ended' && (
              <Button variant="tertiary" size="sm" onClick={() => setPending('ended')}>
                {t('pa.end')}
              </Button>
            )}
            {p.status === 'active' && (
              <Button size="sm" onClick={() => change('renew', 'Renewed for 12 months')}>
                {t('pa.renew')}
              </Button>
            )}
          </>
        )
      }
    >
      <Link to="/a/partners" className="mb-4 inline-flex items-center gap-1.5 t-caption text-ink-2 hover:text-ink">
        <ArrowLeft size={14} strokeWidth={1.5} /> {t('agency.nav.talentPartners')}
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LogoTile monogram={p.monogram} />
        <Chip tone={STATUS_TONE[sk]}>{t(`ag.partnerStatus.${sk}`)}</Chip>
        {data.behindOnRoles && <Chip tone="attention">{t('pa.flag.behind')}</Chip>}
        {data.slowToRespond && <Chip tone="pending">{t('pa.flag.slow')}</Chip>}
      </div>
      {p.status === 'paused' && <Note tone="attention" className="mb-4">{t('pa.pausedNote')}</Note>}
      {p.onboardingStage === 'probation' && p.probationEndsAt && <Note className="mb-4">{t('pa.probationEnds', { date: formatDate(p.probationEndsAt, lang, 'long') })}</Note>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <SectionLabel className="mb-3">{t('pa.onboarding')}</SectionLabel>
          <ol className="space-y-2">
            {STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-circle t-micro',
                    i < stageIdx || p.onboardingStage === 'complete' ? 'bg-done text-done-ink' : i === stageIdx ? 'bg-ink text-surface' : 'bg-surface-muted text-ink-3',
                  )}
                  aria-hidden
                >
                  {i < stageIdx || p.onboardingStage === 'complete' ? <Check size={12} strokeWidth={2} /> : i + 1}
                </span>
                <span className={i === stageIdx ? 't-body-strong' : 'text-ink-2'}>{t(`pa.stage.${s}`)}</span>
              </li>
            ))}
          </ol>
          <SectionLabel className="mb-3 mt-5">{t('pa.verification')}</SectionLabel>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['ssm', 'domain', 'hrContacts', 'agreement'] as const).map((k) => (
              <CheckBadge key={k} state={p.verification[k]} label={t(`pa.check.${k}`)} />
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel className="mb-3">{t('pa.agreement')}</SectionLabel>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Stat label={t('pa.rolesPerYear')} value={String(p.agreement.rolesPerYear)} />
            <Stat label={t('pa.salaryFloor')} value={formatRM(p.agreement.salaryFloorRM)} />
            <Stat label={t('pa.responseDays')} value={t('pa.days', { count: p.agreement.responseDays })} />
            <Stat label={t('pa.renews')} value={p.agreement.renewsAt ? formatDate(p.agreement.renewsAt, lang, 'long') : '—'} />
            <Stat label={t('pa.seats')} value={String(p.seats)} />
          </dl>
          <SectionLabel className="mb-3 mt-5">{t('pa.metrics')}</SectionLabel>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Stat label={t('pa.col.roles')} value={`${p.metrics.rolesPosted} / ${data.committedToDate}`} />
            <Stat label={t('pa.col.invitations')} value={formatNumber(p.metrics.invitations)} />
            <Stat label={t('pa.col.acceptance')} value={`${Math.round(p.metrics.acceptanceRate * 100)}%`} />
            <Stat label={t('pa.col.hires')} value={String(p.metrics.hires)} />
            <Stat label={t('pa.col.response')} value={t('pa.hours', { h: p.metrics.avgResponseHours })} />
            <Stat label={t('pa.col.complaints')} value={String(p.metrics.complaints)} />
          </dl>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card padded={false} className="overflow-hidden">
          <SectionLabel className="px-5 pb-3 pt-5">{t('pa.roles')}</SectionLabel>
          {data.roles.length === 0 ? (
            <EmptyState title={t('ag.empty')} />
          ) : (
            <Table minWidth={520}>
              <THead>
                <Th>{t('ag.pl.role')}</Th>
                <Th>{t('ag.ra.salary')}</Th>
                <Th>{t('pa.col.status')}</Th>
              </THead>
              <tbody>
                {data.roles.map((r) => (
                  <Tr key={r.id}>
                    <Td>{r.title}</Td>
                    <Td className="tabular whitespace-nowrap">{formatRMRange(r.salaryRM)}</Td>
                    <Td>
                      <Chip tone={r.status === 'live' ? 'done' : r.status === 'pendingApproval' ? 'pending' : 'muted'} size="sm">
                        {t(`pa.roleStatus.${r.status}`)}
                      </Chip>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <SectionLabel className="mb-3">{t('pa.notes')}</SectionLabel>
          {canAct && (
            <form
              className="mb-4 space-y-2"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!note.trim()) return
                await addPartnerNote(officer, p.id, note.trim())
                setNote('')
                toast(t('ag.done'))
              }}
            >
              <Textarea label={t('pa.addNote')} placeholder={t('pa.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              <Button type="submit" variant="secondary" size="sm" disabled={!note.trim()}>
                {t('pa.addNote')}
              </Button>
            </form>
          )}
          <ul className="space-y-3">
            {p.notes.map((n) => (
              <li key={n.id}>
                <p className="t-body-sm">{n.body}</p>
                <p className="t-caption font-normal text-ink-3">
                  {n.by} · {formatDate(n.at, lang, 'long')}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ReasonDialog
        open={!!pending}
        title={pending === 'ended' ? t('pa.end') : t('pa.pause')}
        confirmLabel={t('ag.confirm')}
        presets={pending === 'ended' ? ['Agreement not renewed', 'Repeated complaints from students'] : ['Behind on committed roles', 'Complaint under investigation']}
        onCancel={() => setPending(null)}
        onConfirm={(r) => change(pending, r)}
      />
    </AgencyPage>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="t-caption text-ink-2">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  )
}
