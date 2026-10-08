import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { MatchRing } from '@/components/ui/Rings'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { LogoTile } from '@/components/ui/Tiles'
import { JobLogRow } from '@/components/student/JobLogRow'
import { PartnerRoleCard } from '@/components/student/PartnerRoleCard'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate, formatRMRange } from '@/lib/format'
import { buildOpenJobs, listLinkOutPortals, type OpenJobView } from '@/services/jobs'
import { buildLog, buildSummary, CURRENT_MONTH } from '@/services/jobLog'
import { buildRoleViews, hiddenRoleCount, type PartnerRoleView } from '@/services/partners'
import { employerVisibleSkills } from '@/services/profile'
import { skillById } from '@/services/taxonomy'
import { getTier } from '@/services/tiers'
import { delay } from '@/services/delay'
import { useDemo } from '@/state/DemoProvider'
import { StudentPage } from '../shell/StudentPage'
import { JobSheet } from '../opportunities/JobSheet'
import { LogEntrySheet } from '../opportunities/LogEntrySheet'
import { LogSheet } from '../opportunities/LogSheet'
import { MonthlySummaryCard } from '../opportunities/MonthlySummaryCard'
import { RoleSheet } from '../opportunities/RoleSheet'
import { statusOf } from '../opportunities/logStatus'
import { useStudent } from '../useStudent'

type Tab = 'partner' | 'open' | 'log'

/** Opportunities: Partner roles (premium, tier-gated) · Open jobs (portals) · My job search log. */
export default function OpportunitiesPage() {
  const { t, lt, lang } = useT()
  const { settings } = useDemo()
  const { id, data: student } = useStudent()
  const [params, setParams] = useSearchParams()
  const tab = (['partner', 'open', 'log'].includes(params.get('tab') ?? '') ? params.get('tab') : 'partner') as Tab
  const inviteParam = params.get('invite')
  const entryParam = params.get('entry')

  const { data } = useAsync(
    () =>
      delay(
        {
          roles: buildRoleViews(id, settings),
          hidden: hiddenRoleCount(id, settings),
          tierB: getTier(id, settings) === 'B',
          jobs: buildOpenJobs(id, settings),
          linkOut: listLinkOutPortals(settings),
          log: buildLog(id),
          summary: buildSummary(id, settings),
        },
        150,
      ),
    [id, settings],
  )

  const [roleId, setRoleId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [entryId, setEntryId] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState<{ entryId?: string } | null>(null)

  const setTab = (v: Tab) => setParams({ tab: v }, { replace: true })
  const clearParam = (k: string) => {
    const p = new URLSearchParams(params)
    p.delete(k)
    setParams(p, { replace: true })
  }

  const onboarded = student?.student.onboardingStep === 'done'
  const roleViews = data?.roles ?? []
  const invitations = roleViews.filter((r) => r.invitation && r.invitation.origin !== 'student' && r.invitation.stage !== 'declined')
  const others = roleViews.filter((r) => !invitations.includes(r))
  const openRoleId = roleId ?? (inviteParam ? roleViews.find((r) => r.invitation?.id === inviteParam)?.role.id ?? null : null)
  const openRole: PartnerRoleView | null = roleViews.find((r) => r.role.id === openRoleId) ?? null
  const openJob: OpenJobView | null = data?.jobs.find((j) => j.id === jobId) ?? null
  const openEntryId = entryId ?? entryParam
  const openEntry = data?.log.find((e) => e.id === openEntryId) ?? null
  const topSkills = employerVisibleSkills(student?.skills ?? []).slice(0, 3)
  const thisMonth = (data?.log ?? []).filter((e) => e.appliedAt.startsWith(CURRENT_MONTH))
  const earlier = (data?.log ?? []).filter((e) => !e.appliedAt.startsWith(CURRENT_MONTH))

  const roleCard = (v: PartnerRoleView) => {
    const inv = v.invitation
    const badge = inv ? (
      <Chip tone={inv.stage === 'invited' ? 'pending' : inv.origin === 'student' ? 'info' : 'done'} size="sm">
        {inv.stage === 'invited' ? t('status.invitationWaiting') : inv.origin === 'student' ? t('status.interestSent') : t(`role.stage.${inv.stage}` as 'role.stage.talking')}
      </Chip>
    ) : undefined
    return (
      <PartnerRoleCard
        key={v.role.id}
        title={v.role.title}
        partnerName={v.partner.name}
        monogram={v.partner.monogram}
        location={v.role.location}
        salary={v.role.salaryRM}
        matchPct={v.matchPct}
        skills={v.detail.filter((d) => d.met).map((d) => lt(skillById(d.skillId)?.name ?? { en: d.skillId }))}
        access={v.access}
        badge={badge}
        onOpen={() => setRoleId(v.role.id)}
        onUnlock={() => setRoleId(v.role.id)}
      />
    )
  }

  const logList = (items: typeof thisMonth) => (
    <Card padded={false} className="divide-y divide-hairline px-3 py-1">
      {items.map((e) => {
        const st = statusOf(e.status)
        return (
          <JobLogRow
            key={e.id}
            portalMonogram={e.portalName.slice(0, 2).toUpperCase()}
            role={e.role}
            company={e.company}
            date={formatDate(e.appliedAt, lang)}
            evidenceSrc={e.evidence?.previewUrl}
            status={st.row}
            statusLabel={t(st.key)}
            onOpen={() => setEntryId(e.id)}
          />
        )
      })}
    </Card>
  )

  return (
    <StudentPage title={t('student.opportunities.title')}>
      <SegmentedControl<Tab>
        ariaLabel={t('student.opportunities.title')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'partner', label: t('opp.tab.partner') },
          { value: 'open', label: t('opp.tab.open') },
          { value: 'log', label: t('opp.tab.log') },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-6">
          {tab === 'partner' &&
            (!onboarded ? (
              <Card>
                <EmptyState title={t('opp.partner.empty')} />
              </Card>
            ) : (
              <>
                <p className="t-body text-ink-2">{t('opp.partner.lead')}</p>
                {invitations.length > 0 && (
                  <section className="space-y-3">
                    <SectionLabel>{t('opp.partner.invitations')}</SectionLabel>
                    {invitations.map(roleCard)}
                  </section>
                )}
                <section className="space-y-3">
                  <SectionLabel>{t('opp.partner.matched')}</SectionLabel>
                  {data?.tierB && settings.tierB.partnerRoles === 'earlyAccessWindow' && <Note tone="muted">{t('opp.partner.lockedNote', { days: settings.tierB.earlyAccessDays })}</Note>}
                  {others.map(roleCard)}
                  {(data?.hidden ?? 0) > 0 && <Note tone="muted">{t('opp.partner.hiddenNote')}</Note>}
                </section>
              </>
            ))}

          {tab === 'open' && (
            <>
              <p className="t-body text-ink-2">{t('opp.open.lead')}</p>
              <ul className="space-y-3">
                {(data?.jobs ?? []).map((j) => (
                  <li key={j.id}>
                    <Card as="article">
                      <button onClick={() => setJobId(j.id)} className="flex w-full items-start gap-3 text-left">
                        <LogoTile monogram={j.portal.monogram} />
                        <span className="min-w-0 flex-1">
                          <span className="block t-subheading">{j.title}</span>
                          <span className="block t-caption font-normal text-ink-2">
                            {j.company} · {j.location}
                          </span>
                          <span className="mt-1 block t-caption text-ink tabular">{j.salaryRM ? formatRMRange(j.salaryRM) : j.portal.name}</span>
                        </span>
                        <MatchRing pct={j.matchPct} label={t('role.match', { pct: j.matchPct })} />
                      </button>
                    </Card>
                  </li>
                ))}
              </ul>
              {(data?.linkOut.length ?? 0) > 0 && (
                <section className="space-y-3">
                  <SectionLabel>{t('opp.open.curated')}</SectionLabel>
                  <p className="t-caption font-normal text-ink-2">{t('opp.open.curatedLead')}</p>
                  {data!.linkOut.map((p) => (
                    <Card key={p.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <LogoTile monogram={p.monogram} />
                        <p className="flex-1 t-body-strong">{p.name}</p>
                        <ExternalLink size={16} strokeWidth={1.5} className="text-ink-3" aria-hidden />
                      </div>
                      {topSkills.map((s) => {
                        const q = skillById(s.skillId)?.name.en ?? s.skillId
                        return (
                          <a
                            key={s.skillId}
                            href={p.searchUrlTemplate.replace('{q}', encodeURIComponent(q))}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center gap-2 rounded-control bg-surface-muted px-3 py-2 t-caption text-ink hover:bg-hairline"
                          >
                            <Search size={14} strokeWidth={1.5} aria-hidden />
                            {t('opp.open.search', { portal: p.name, q: lt(skillById(s.skillId)?.name ?? { en: q }) })}
                          </a>
                        )
                      })}
                    </Card>
                  ))}
                </section>
              )}
            </>
          )}

          {tab === 'log' && data && (
            <>
              <p className="t-body text-ink-2">{t('opp.log.lead')}</p>
              <MonthlySummaryCard summary={data.summary} title={formatDate(`${CURRENT_MONTH}-01`, lang, 'month')} />
              <Button block icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setLogOpen({})}>
                {t('opp.log.add')}
              </Button>
              {data.log.length === 0 ? (
                <Card>
                  <EmptyState title={t('empty.jobLog.title')} body={t('empty.jobLog.body')} />
                </Card>
              ) : (
                <>
                  {thisMonth.length > 0 && (
                    <section className="space-y-2">
                      <SectionLabel>{t('opp.log.thisMonth')}</SectionLabel>
                      {logList(thisMonth)}
                    </section>
                  )}
                  {earlier.length > 0 && (
                    <section className="space-y-2">
                      <SectionLabel>{t('opp.log.earlier')}</SectionLabel>
                      {logList(earlier)}
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <RoleSheet
        view={openRole}
        studentId={id}
        open={!!openRole}
        onClose={() => {
          setRoleId(null)
          if (inviteParam) clearParam('invite')
        }}
      />
      <JobSheet job={openJob} studentId={id} open={!!openJob} onClose={() => setJobId(null)} />
      <LogEntrySheet
        entry={openEntry}
        studentId={id}
        open={!!openEntry && !logOpen}
        onClose={() => {
          setEntryId(null)
          if (entryParam) clearParam('entry')
        }}
        onAddEvidence={(eid) => setLogOpen({ entryId: eid })}
      />
      {logOpen && (
        <LogSheet
          key={logOpen.entryId ?? 'new'}
          studentId={id}
          entryId={logOpen.entryId}
          open
          onClose={() => {
            setLogOpen(null)
            setEntryId(null)
            if (entryParam) clearParam('entry')
          }}
        />
      )}
    </StudentPage>
  )
}
