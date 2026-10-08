import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { LogoTile } from '@/components/ui/Tiles'
import { JobLogRow } from '@/components/student/JobLogRow'
import { FamilyFilter } from '@/components/student/FamilyFilter'
import { OpportunityRow } from '@/components/student/OpportunityRow'
import { ShowMore } from '@/components/ui/ShowMore'
import { familyThumb, jobFamily, type JobFamily } from '@/services/jobFamily'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate, formatRMRange } from '@/lib/format'
import { buildOpenJobs, listLinkOutPortals, type OpenJobView } from '@/services/jobs'
import { buildLog, buildSummary, CURRENT_MONTH } from '@/services/jobLog'
import { buildRoleViews, hiddenRoleCount, isOutreachPaused, type PartnerRoleView } from '@/services/partners'
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
const PAGE = 6

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
  const [roleFamily, setRoleFamily] = useState<JobFamily | 'all'>('all')
  const [jobFam, setJobFam] = useState<JobFamily | 'all'>('all')
  const [roleLimit, setRoleLimit] = useState(PAGE)
  const [jobLimit, setJobLimit] = useState(PAGE)

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

  const roleRow = (v: PartnerRoleView) => {
    const inv = v.invitation
    const badge = inv ? (
      <Chip tone={inv.stage === 'invited' ? 'pending' : inv.origin === 'student' ? 'info' : 'done'} size="sm">
        {inv.stage === 'invited' ? t('status.invitationWaiting') : inv.origin === 'student' ? t('status.interestSent') : t(`role.stage.${inv.stage}` as 'role.stage.talking')}
      </Chip>
    ) : undefined
    return (
      <OpportunityRow
        key={v.role.id}
        title={v.role.title}
        org={`${v.partner.name} · ${v.role.location}`}
        meta={formatRMRange(v.role.salaryRM)}
        matchPct={v.matchPct}
        thumb={familyThumb(jobFamily(v.role.title))}
        monogram={v.partner.monogram}
        access={v.access}
        badge={badge}
        onOpen={() => setRoleId(v.role.id)}
        onUnlock={() => setRoleId(v.role.id)}
      />
    )
  }
  const visibleOthers = others.filter((r) => r.access !== 'hidden' && (roleFamily === 'all' || jobFamily(r.role.title) === roleFamily))
  const jobs = (data?.jobs ?? []).filter((j) => jobFam === 'all' || jobFamily(j.title) === jobFam)
  const countBy = <T,>(items: T[], title: (x: T) => string) => items.reduce<Partial<Record<JobFamily, number>>>((m, x) => {
    const f = jobFamily(title(x))
    m[f] = (m[f] ?? 0) + 1
    return m
  }, {})

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
                {isOutreachPaused() && <Note tone="pending">{t('opp.partner.outreachPaused')}</Note>}
                {invitations.length > 0 && (
                  <section className="space-y-3">
                    <SectionLabel>{t('opp.partner.invitations')}</SectionLabel>
                    <Card padded={false} className="divide-y divide-hairline overflow-hidden">
                      {invitations.map(roleRow)}
                    </Card>
                  </section>
                )}
                <section className="space-y-3">
                  <SectionLabel>{t('opp.partner.matched')}</SectionLabel>
                  {data?.tierB && settings.tierB.partnerRoles === 'earlyAccessWindow' && <Note tone="muted">{t('opp.partner.lockedNote', { days: settings.tierB.earlyAccessDays })}</Note>}
                  <FamilyFilter counts={countBy(others.filter((r) => r.access !== 'hidden'), (r) => r.role.title)} value={roleFamily} onChange={(f) => { setRoleFamily(f); setRoleLimit(PAGE) }} />
                  <Card padded={false} className="divide-y divide-hairline overflow-hidden">
                    {visibleOthers.slice(0, roleLimit).map(roleRow)}
                  </Card>
                  <ShowMore remaining={visibleOthers.length - roleLimit} label={t('list.showMore', { count: Math.min(PAGE, visibleOthers.length - roleLimit) })} onClick={() => setRoleLimit((n) => n + PAGE)} />
                  {(data?.hidden ?? 0) > 0 && <Note tone="muted">{t('opp.partner.hiddenNote')}</Note>}
                </section>
              </>
            ))}

          {tab === 'open' && (
            <>
              <p className="t-body text-ink-2">{t('opp.open.lead')}</p>
              <FamilyFilter counts={countBy(data?.jobs ?? [], (j) => j.title)} value={jobFam} onChange={(f) => { setJobFam(f); setJobLimit(PAGE) }} />
              <Card padded={false} className="divide-y divide-hairline overflow-hidden" data-list="jobs">
                {jobs.slice(0, jobLimit).map((j) => (
                  <OpportunityRow
                    key={j.id}
                    title={j.title}
                    org={`${j.company} · ${j.location}`}
                    meta={j.salaryRM ? formatRMRange(j.salaryRM) : j.portal.name}
                    matchPct={j.matchPct}
                    thumb={familyThumb(jobFamily(j.title))}
                    monogram={j.portal.monogram}
                    onOpen={() => setJobId(j.id)}
                  />
                ))}
              </Card>
              <ShowMore remaining={jobs.length - jobLimit} label={t('list.showMore', { count: Math.min(PAGE, jobs.length - jobLimit) })} onClick={() => setJobLimit((n) => n + PAGE)} />
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
