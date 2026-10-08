import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BriefcaseBusiness, CheckCircle2, ChevronRight, Circle, Eye, Lightbulb, Mail, Plus, ShieldCheck, Sparkles, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { LevelBar } from '@/components/ui/LevelBar'
import { ProgressRing } from '@/components/ui/Rings'
import { Rail, RailItem } from '@/components/ui/Rail'
import { StatTile } from '@/components/ui/StatTile'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { IconTile } from '@/components/ui/Tiles'
import { HeroCard } from '@/components/student/HeroCard'
import { NextStepCard } from '@/components/student/NextStepCard'
import { OpportunityRow, OpportunityTile } from '@/components/student/OpportunityRow'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import type { I18nKey } from '@/i18n/en'
import { Rich } from '@/i18n/Rich'
import { formatDate, formatRMRange } from '@/lib/format'
import { getHome, HOME_TIPS } from '@/services/home'
import { studentHomePath } from '@/services/students'
import { categoryThumb, skillById } from '@/services/taxonomy'
import { courseThumb } from '@/services/courses'
import { familyThumb, jobFamily } from '@/services/jobFamily'
import { useDemo } from '@/state/DemoProvider'
import { JobSheet } from '../opportunities/JobSheet'
import { LogSheet } from '../opportunities/LogSheet'
import { RoleSheet } from '../opportunities/RoleSheet'
import { StudentPage } from '../shell/StudentPage'
import { useStudent } from '../useStudent'

function greetingKey(): I18nKey {
  const h = new Date().getHours()
  return h < 12 ? 'greeting.morning' : h < 19 ? 'greeting.afternoon' : 'greeting.evening'
}

const SETUP_KEYS: Record<string, I18nKey> = {
  record: 'home.setup.record',
  transcript: 'home.setup.transcript',
  activities: 'home.setup.activities',
  evidence: 'home.setup.evidence',
  preferences: 'home.setup.preferences',
  review: 'home.setup.review',
  visible: 'home.setup.visible',
}

/** Repayment standing as a tile: status and benefits count only; never amounts on Home. */
function StandingTile({ st, onClick }: { st: { tier: 'A' | 'B'; status: string; unlocked: number; total: number }; onClick: () => void }) {
  const { t } = useT()
  const behind = st.tier === 'B'
  return (
    <StatTile
      visual={
        <IconTile className={behind ? 'bg-attention text-attention-ink' : st.status === 'grace' ? 'bg-info text-info-ink' : 'bg-done text-done-ink'}>
          <ShieldCheck size={18} strokeWidth={1.5} />
        </IconTile>
      }
      value={
        <span className="tabular">
          {st.unlocked}
          <span className="text-ink-3">/{st.total}</span>
        </span>
      }
      label={t('home.glance.benefits')}
      extra={
        <Chip tone={behind ? 'attention' : st.status === 'grace' ? 'info' : 'done'} size="sm">
          {behind ? t('status.behind') : st.status === 'grace' ? t('status.gracePeriod') : t('status.goodStanding')}
        </Chip>
      }
      onClick={onClick}
    />
  )
}

/** Home: one scrolling feed ordered by urgency — reply first, then progress, then growth. */
export default function HomePage() {
  const { t, lt, lang } = useT()
  const navigate = useNavigate()
  const { settings } = useDemo()
  const { id } = useStudent()
  const { data: h } = useAsync(() => getHome(id, settings), [id, settings])
  const [roleId, setRoleId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [logging, setLogging] = useState(false)

  const name = (sid: string) => lt(skillById(sid)?.name ?? { en: sid })
  const page = (children: React.ReactNode) => (
    <StudentPage title={t('student.home.title')} wash eyebrow={t(greetingKey())} heading={h ? <Rich text={t('greeting.hi', { name: h.student.preferredName })} /> : t('student.home.title')}>
      {children}
    </StudentPage>
  )
  if (!h) return page(null)

  // ---------------------------------------------------------------- Hero (state-driven)
  let hero: React.ReactNode
  if (!h.onboarded) {
    hero = (
      <HeroCard
        liveLabel={t('status.live')}
        icons={[<Sparkles key="s" size={14} strokeWidth={1.5} />]}
        headline={<Rich text={t('home.hero.new')} />}
        body={t('home.hero.newBody')}
        action={<Button onClick={() => navigate(studentHomePath(id))}>{t('home.hero.newAction')}</Button>}
      />
    )
  } else if (h.invitations.length) {
    hero = (
      <HeroCard
        liveLabel={t('status.live')}
        icons={h.invitations.slice(0, 3).map((r) => <span key={r.role.id} className="t-micro font-semibold">{r.partner.monogram}</span>)}
        headline={<Rich text={t('home.hero.invited', { count: h.invitations.length })} />}
        body={t('home.hero.invitedBody', { names: h.invitations.map((r) => r.partner.name.split(' ').slice(0, 2).join(' ')).join(' & ') })}
        action={<Button onClick={() => navigate('/s/opportunities?tab=partner')}>{t('home.hero.invitedAction')}</Button>}
      />
    )
  } else {
    hero = (
      <HeroCard
        liveLabel={t('status.live')}
        icons={[<Eye key="e" size={14} strokeWidth={1.5} />, <BriefcaseBusiness key="b" size={14} strokeWidth={1.5} />]}
        headline={<Rich text={t('home.hero.live')} />}
        body={t('home.hero.liveBody', { views: h.interest.viewsThisWeek })}
        action={<Button onClick={() => navigate('/s/opportunities?tab=open')}>{t('home.hero.liveAction')}</Button>}
      />
    )
  }

  // ---------------------------------------------------------------- Next step (one at a time)
  const nx = h.next
  const nextText =
    nx.kind === 'reply'
      ? t('home.next.reply', { date: formatDate(String(nx.vars.date), lang, 'weekday') })
      : nx.kind === 'gap' || nx.kind === 'finishProfile'
        ? t(`home.next.${nx.kind}`)
        : t(`home.next.${nx.kind}` as 'home.next.reupload', { count: Number(nx.vars.count) })
  const nextLink = nx.kind === 'finishProfile' ? studentHomePath(id) : nx.link

  const openRole = h.roles.find((r) => r.role.id === roleId) ?? h.invitations.find((r) => r.role.id === roleId) ?? null
  const openJob = h.jobs.find((j) => j.id === jobId) ?? null
  const delta = h.interest.viewsThisWeek - h.interest.viewsLastWeek
  const st = h.standing

  return page(
    <>
      {hero}
      <NextStepCard label={t('home.nextStep.label')} action={nextText} actionLabel={nextText} onClick={() => navigate(nextLink)} />

      {!h.onboarded ? (
        /* New user: setup checklist replaces modules 3–5 */
        <Card>
          <SectionLabel>{t('home.setup.title')}</SectionLabel>
          <p className="mt-1 t-body-strong">{t('home.setup.cantFind')}</p>
          <ul className="mt-3 space-y-2">
            {h.strength.missing.slice(0, 3).map((m) => (
              <li key={m.id}>
                <button onClick={() => navigate(studentHomePath(id))} className="flex w-full items-center gap-3 rounded-control bg-surface-muted p-3 text-left">
                  <Circle size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
                  <span className="flex-1 t-body">{t(SETUP_KEYS[m.id])}</span>
                  <Chip tone="muted" size="sm">
                    {t('home.setup.points', { points: m.points })}
                  </Chip>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <>
          {/* 3 · At a glance: interest, job search and standing as four tiles */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              visual={<IconTile className="bg-info text-info-ink"><Eye size={18} strokeWidth={1.5} /></IconTile>}
              value={<AnimatedNumber value={h.interest.viewsThisWeek} from={0} />}
              label={t('home.interest.views')}
              extra={
                <Chip tone={delta >= 0 ? 'done' : 'muted'} size="sm">
                  {t('home.interest.vsLast', { delta: `${delta >= 0 ? '+' : ''}${delta}` })}
                </Chip>
              }
            />
            <StatTile
              visual={<IconTile className="bg-pending text-pending-ink"><Mail size={18} strokeWidth={1.5} /></IconTile>}
              value={h.interest.invitations}
              label={t('home.interest.invitations')}
              onClick={() => navigate('/s/opportunities?tab=partner')}
            />
            <StatTile
              visual={
                <ProgressRing value={Math.min(100, (h.summary.verified / Math.max(1, h.summary.threshold)) * 100)} size={36} stroke={4} label={t('home.jobsearch.progress', { verified: h.summary.verified, threshold: h.summary.threshold })}>
                  <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden />
                </ProgressRing>
              }
              value={
                <span className="tabular">
                  {h.summary.verified}
                  <span className="text-ink-3">/{h.summary.threshold}</span>
                </span>
              }
              label={t('home.glance.jobSearch')}
              onClick={() => navigate('/s/opportunities?tab=log')}
            />
            <StandingTile st={st} onClick={() => navigate('/s/repayment')} />
          </div>
          <Button variant="secondary" block icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setLogging(true)}>
            {t('action.logApplication')}
          </Button>
          {h.interest.invitations === 0 && h.interest.viewsThisWeek === 0 && (
            <Card>
              <p className="mb-2 t-caption text-ink-2">{t('home.interest.tipsTitle')}</p>
              <ul className="space-y-2">
                {HOME_TIPS.map((tip, i) => (
                  <li key={i} className="flex gap-2 t-body">
                    <Lightbulb size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
                    {lt(tip)}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 4 · Partner roles: a swipeable rail instead of a long stack */}
          {h.roles.length > 0 && (
            <section className="space-y-3">
              <SectionLabel action={<Button variant="tertiary" size="sm" onClick={() => navigate('/s/opportunities?tab=partner')}>{t('action.viewAll')}</Button>}>{t('home.roles.title')}</SectionLabel>
              <Rail label={t('home.roles.title')}>
                {h.roles.map((v) => (
                  <RailItem key={v.role.id} width={220}>
                    <OpportunityTile
                      title={v.role.title}
                      org={v.partner.name}
                      meta={formatRMRange(v.role.salaryRM)}
                      matchPct={v.matchPct}
                      thumb={familyThumb(jobFamily(v.role.title))}
                      monogram={v.partner.monogram}
                      access={v.access}
                      badge={v.invitation?.stage === 'invited' ? <Chip tone="pending" size="sm">{t('status.invitationWaiting')}</Chip> : undefined}
                      onOpen={() => setRoleId(v.role.id)}
                      onUnlock={() => setRoleId(v.role.id)}
                    />
                  </RailItem>
                ))}
              </Rail>
            </section>
          )}

          {/* 5 · Open jobs: top three */}
          {h.jobs.length > 0 && (
            <section className="space-y-3">
              <SectionLabel action={<Button variant="tertiary" size="sm" onClick={() => navigate('/s/opportunities?tab=open')}>{t('action.viewAll')}</Button>}>{t('home.openjobs.title')}</SectionLabel>
              <Card padded={false} className="divide-y divide-hairline overflow-hidden">
                {h.jobs.slice(0, 3).map((j) => (
                  <OpportunityRow
                    key={j.id}
                    title={j.title}
                    org={j.company}
                    meta={j.salaryRM ? formatRMRange(j.salaryRM) : j.location}
                    matchPct={j.matchPct}
                    thumb={familyThumb(jobFamily(j.title))}
                    monogram={j.portal.monogram}
                    onOpen={() => setJobId(j.id)}
                  />
                ))}
              </Card>
            </section>
          )}

          {/* 6 · Skill snapshot: top three + the one gap */}
          <section className="space-y-3">
            <SectionLabel action={<Button variant="tertiary" size="sm" onClick={() => navigate('/s/profile')}>{t('action.viewAll')}</Button>}>{t('home.snapshot.title')}</SectionLabel>
            <Card className="space-y-3">
              {h.topSkills.slice(0, 3).map((s) => (
                <div key={s.skillId} className="flex items-center gap-3">
                  <img src={categoryThumb(skillById(s.skillId)?.categoryId ?? '')} alt="" className="h-8 w-8 shrink-0 rounded-chip" />
                  <span className="min-w-0 flex-1 truncate t-body">{name(s.skillId)}</span>
                  <LevelBar level={s.level} label={t(`skill.level.${s.level}`)} className="w-16" />
                </div>
              ))}
              {h.gap && (
                <div className="flex items-start gap-3 rounded-control bg-surface-muted p-3">
                  <IconTile className="bg-pending text-pending-ink">
                    <Target size={18} strokeWidth={1.5} />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="t-body-strong">{t('home.snapshot.gap', { skill: name(h.gap.skillId) })}</p>
                    <p className="t-caption font-normal text-ink-2">{t('home.snapshot.unlocks', { count: h.gap.unlocksMatches })}</p>
                    <Button variant="tertiary" size="sm" onClick={() => navigate(`/s/learn/gap/${h.gap!.skillId}`)}>
                      {t('action.closeGap')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* 7 · Keep learning, with the course picture */}
          {h.learning && (
            <Card padded={false} className="overflow-hidden">
              <button onClick={() => navigate('/s/learn')} className="flex w-full items-center gap-3 p-3 text-left">
                <img src={courseThumb(h.learning.kind === 'inProgress' ? h.learning.enrolment.course : h.learning.course)} alt="" className="h-16 w-24 shrink-0 rounded-control object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block t-caption text-ink-2">{h.learning.kind === 'inProgress' ? t('home.learning.title') : t('home.learning.recommended')}</span>
                  <span className="block truncate t-body-strong">{lt(h.learning.kind === 'inProgress' ? h.learning.enrolment.course.title : h.learning.course.title)}</span>
                  {h.learning.kind === 'inProgress' && (
                    <span className="mt-2 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-sm bg-hairline">
                        <span className="block h-full bg-ink" style={{ width: `${h.learning.enrolment.progressPct}%` }} />
                      </span>
                      <span className="t-caption tabular text-ink-2">{h.learning.enrolment.progressPct}%</span>
                    </span>
                  )}
                </span>
                <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-ink-3" aria-hidden />
              </button>
            </Card>
          )}
        </>
      )}

      {/* Standing for students still setting up (status and dates only; never amounts on Home) */}
      {!h.onboarded && <StandingTile st={st} onClick={() => navigate('/s/repayment')} />}

      <RoleSheet view={openRole} studentId={id} open={!!openRole} onClose={() => setRoleId(null)} />
      <JobSheet job={openJob} studentId={id} open={!!openJob} onClose={() => setJobId(null)} />
      {logging && <LogSheet studentId={id} open onClose={() => setLogging(false)} />}
    </>,
  )
}
