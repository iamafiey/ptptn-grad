import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BookOpen, BriefcaseBusiness, Check, Circle, Eye, Lightbulb, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { LevelBar } from '@/components/ui/LevelBar'
import { MatchRing } from '@/components/ui/Rings'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { LogoTile, IconTile } from '@/components/ui/Tiles'
import { HeroCard } from '@/components/student/HeroCard'
import { NextStepCard } from '@/components/student/NextStepCard'
import { PartnerRoleCard } from '@/components/student/PartnerRoleCard'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import type { I18nKey } from '@/i18n/en'
import { Rich } from '@/i18n/Rich'
import { formatDate, formatRMRange } from '@/lib/format'
import { getHome, HOME_TIPS } from '@/services/home'
import { studentHomePath } from '@/services/students'
import { skillById } from '@/services/taxonomy'
import { useDemo } from '@/state/DemoProvider'
import { JobSheet } from '../opportunities/JobSheet'
import { LogSheet } from '../opportunities/LogSheet'
import { MonthlySummaryCard } from '../opportunities/MonthlySummaryCard'
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
          {/* 3 · Partner interest */}
          <Card>
            <SectionLabel>{t('home.interest.title')}</SectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="t-heading tabular">
                  <AnimatedNumber value={h.interest.viewsThisWeek} from={0} />
                </p>
                <p className="t-caption font-normal text-ink-2">{t('home.interest.views')}</p>
                <Chip tone={delta >= 0 ? 'done' : 'muted'} size="sm" className="mt-1">
                  {t('home.interest.vsLast', { delta: `${delta >= 0 ? '+' : ''}${delta}` })}
                </Chip>
              </div>
              <div>
                <p className="t-heading tabular">{h.interest.invitations}</p>
                <p className="t-caption font-normal text-ink-2">{t('home.interest.invitations')}</p>
              </div>
            </div>
            {h.interest.invitations === 0 && h.interest.viewsThisWeek === 0 && (
              <div className="mt-4 border-t border-hairline pt-3">
                <p className="mb-2 t-caption text-ink-2">{t('home.interest.tipsTitle')}</p>
                <ul className="space-y-2">
                  {HOME_TIPS.map((tip, i) => (
                    <li key={i} className="flex gap-2 t-body">
                      <Lightbulb size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
                      {lt(tip)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* 4 · Partner roles */}
          {h.roles.length > 0 && (
            <section className="space-y-3">
              <SectionLabel action={<Button variant="tertiary" size="sm" onClick={() => navigate('/s/opportunities?tab=partner')}>{t('action.viewAll')}</Button>}>{t('home.roles.title')}</SectionLabel>
              {h.roles.map((v) => (
                <PartnerRoleCard
                  key={v.role.id}
                  title={v.role.title}
                  partnerName={v.partner.name}
                  monogram={v.partner.monogram}
                  location={v.role.location}
                  salary={v.role.salaryRM}
                  matchPct={v.matchPct}
                  skills={v.detail.filter((d) => d.met).map((d) => name(d.skillId))}
                  access={v.access}
                  badge={v.invitation?.stage === 'invited' ? <Chip tone="pending" size="sm">{t('status.invitationWaiting')}</Chip> : undefined}
                  onOpen={() => setRoleId(v.role.id)}
                  onUnlock={() => setRoleId(v.role.id)}
                />
              ))}
            </section>
          )}

          {/* 5 · Job search this month */}
          <MonthlySummaryCard
            summary={h.summary}
            title={t('home.jobsearch.title')}
            action={
              <Button variant="tertiary" size="sm" onClick={() => setLogging(true)}>
                {t('action.logApplication')}
              </Button>
            }
          />

          {/* 6 · Open jobs */}
          {h.jobs.length > 0 && (
            <section className="space-y-3">
              <SectionLabel action={<Button variant="tertiary" size="sm" onClick={() => navigate('/s/opportunities?tab=open')}>{t('action.viewAll')}</Button>}>{t('home.openjobs.title')}</SectionLabel>
              <Card padded={false} className="divide-y divide-hairline">
                {h.jobs.map((j) => (
                  <button key={j.id} onClick={() => setJobId(j.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted">
                    <LogoTile monogram={j.portal.monogram} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate t-body-strong">{j.title}</span>
                      <span className="block truncate t-caption font-normal text-ink-2">
                        {j.company} · {j.salaryRM ? <span className="tabular">{formatRMRange(j.salaryRM)}</span> : j.location}
                      </span>
                    </span>
                    <MatchRing pct={j.matchPct} label={t('role.match', { pct: j.matchPct })} />
                  </button>
                ))}
              </Card>
            </section>
          )}

          {/* 7 · Skill snapshot + gap */}
          <section className="space-y-3">
            <SectionLabel action={<Button variant="tertiary" size="sm" onClick={() => navigate('/s/profile')}>{t('action.viewAll')}</Button>}>{t('home.snapshot.title')}</SectionLabel>
            <Card className="space-y-3">
              {h.topSkills.map((s) => (
                <div key={s.skillId} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate t-body">{name(s.skillId)}</span>
                  <LevelBar level={s.level} label={t(`skill.level.${s.level}`)} className="w-16" />
                  <Chip tone="muted" size="sm">
                    {t('skill.evidence', { count: s.evidenceIds.length })}
                  </Chip>
                </div>
              ))}
              {h.gap && (
                <div className="rounded-control bg-surface-muted p-3">
                  <p className="t-body-strong">{t('home.snapshot.gap', { skill: name(h.gap.skillId) })}</p>
                  <p className="t-caption font-normal text-ink-2">
                    {h.gap.currentLevel ? t(`skill.level.${h.gap.currentLevel}`) : t('home.snapshot.notYet')} → {t(`skill.level.${h.gap.targetLevel}`)} · {t('home.snapshot.unlocks', { count: h.gap.unlocksMatches })}
                  </p>
                  <Button variant="tertiary" size="sm" className="mt-1" onClick={() => navigate(`/s/learn/gap/${h.gap!.skillId}`)}>
                    {t('action.closeGap')}
                  </Button>
                </div>
              )}
            </Card>
          </section>

          {/* 8 · Keep learning */}
          {h.learning && (
            <Card className="flex items-center gap-3">
              <IconTile>
                <BookOpen size={20} strokeWidth={1.5} />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="t-caption text-ink-2">{h.learning.kind === 'inProgress' ? t('home.learning.title') : t('home.learning.recommended')}</p>
                <p className="truncate t-body-strong">{lt(h.learning.kind === 'inProgress' ? h.learning.enrolment.course.title : h.learning.course.title)}</p>
                {h.learning.kind === 'inProgress' && (
                  <>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-hairline">
                      <div className="h-full bg-ink" style={{ width: `${h.learning.enrolment.progressPct}%` }} />
                    </div>
                    <p className="mt-1 t-caption font-normal text-ink-2">{t('home.learning.progress', { pct: h.learning.enrolment.progressPct })}</p>
                  </>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/s/learn')}>
                {t('home.learning.continue')}
              </Button>
            </Card>
          )}
        </>
      )}

      {/* 9 · Repayment standing — status and dates only; never amounts on Home */}
      <Card>
        <SectionLabel>{t('home.standing.title')}</SectionLabel>
        <div className="mt-3 flex items-center gap-3">
          <IconTile>{st.tier === 'A' ? <ShieldCheck size={20} strokeWidth={1.5} /> : <UsersRound size={20} strokeWidth={1.5} />}</IconTile>
          <div className="min-w-0 flex-1">
            <Chip tone={st.tier === 'B' ? 'attention' : st.status === 'grace' ? 'info' : 'done'} size="sm">
              {st.tier === 'B' ? t('status.behind') : st.status === 'grace' ? t('status.gracePeriod') : t('status.goodStandingLong')}
            </Chip>
            <p className="mt-1 t-caption font-normal text-ink-2">
              {st.status === 'grace' && st.graceEndsAt
                ? t('home.standing.graceEnds', { date: formatDate(st.graceEndsAt, lang, 'long') })
                : st.nextDueAt
                  ? t('home.standing.nextDue', { date: formatDate(st.nextDueAt, lang, 'long') })
                  : null}
            </p>
            <p className="flex items-center gap-1 t-caption text-ink">
              <Check size={14} strokeWidth={2} aria-hidden /> {t('home.standing.benefits', { unlocked: st.unlocked, total: st.total })}
            </p>
          </div>
        </div>
        <Button variant="tertiary" size="sm" className="mt-2" onClick={() => navigate('/s/repayment')}>
          {st.tier === 'B' ? t('home.standing.waysBack') : t('home.standing.view')}
        </Button>
      </Card>

      <RoleSheet view={openRole} studentId={id} open={!!openRole} onClose={() => setRoleId(null)} />
      <JobSheet job={openJob} studentId={id} open={!!openJob} onClose={() => setJobId(null)} />
      {logging && <LogSheet studentId={id} open onClose={() => setLogging(false)} />}
    </>,
  )
}
