// Dev-facing design reference (Phase 1a). Its own explanatory copy is exempt from i18n;
// every string rendered *inside* product components still comes from the dictionary.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  FileUp,
  Moon,
  Play,
  Sparkles,
  Sun,
  UsersRound,
} from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Field, Toggle } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Sheet } from '@/components/ui/Sheet'
import { IconTile, LogoTile } from '@/components/ui/Tiles'
import { Avatar, MatchRing } from '@/components/ui/Rings'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { LevelBar } from '@/components/ui/LevelBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { HeroCard } from '@/components/student/HeroCard'
import { NextStepCard } from '@/components/student/NextStepCard'
import { PartnerRoleCard } from '@/components/student/PartnerRoleCard'
import { SkillCard } from '@/components/student/SkillCard'
import { JobLogRow } from '@/components/student/JobLogRow'
import { LargeTitle, TopAppBar } from '@/components/student/TopAppBar'
import { TabBar } from '@/components/student/TabBar'
import type { StudentTab } from '@/components/student/tabs'
import { useCollapseProgress } from '@/hooks/useCollapseProgress'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { STAGGER } from '@/lib/motion'

// ---------------------------------------------------------------------------
// Specimen copy (EN/BM) used to test heading lengths in both languages.
const SPECIMEN = {
  en: {
    displayXl: <>Your skills, <em>translated</em></>,
    displayL: <>2 partners <em>want to talk</em></>,
    title: 'Opportunities',
    heading: 'Partner roles for you',
    subheading: 'Logistics Executive (Graduate)',
    body: 'Planned supply distribution for 300 families over 2 years.',
    caption: 'Seri Mutiara Logistik Berhad · Shah Alam',
    micro: 'Your next step',
  },
  ms: {
    displayXl: <>Kemahiran anda, <em>diterjemah</em></>,
    displayL: <>2 rakan kongsi <em>ingin berbincang</em></>,
    title: 'Peluang',
    heading: 'Peranan rakan kongsi untuk anda',
    subheading: 'Eksekutif Logistik (Graduan)',
    body: 'Merancang pengagihan bekalan untuk 300 keluarga selama 2 tahun.',
    caption: 'Seri Mutiara Logistik Berhad · Shah Alam',
    micro: 'Langkah seterusnya',
  },
}

const COLOURS = [
  ['--canvas', 'App background'],
  ['--surface', 'Cards'],
  ['--surface-muted', 'Nested blocks, inputs'],
  ['--ink', 'Primary text, buttons, active tab'],
  ['--ink-2', 'Secondary text, labels'],
  ['--ink-3', 'Placeholder, disabled'],
  ['--hairline', 'Borders, dividers'],
  ['--glass', 'Nav bars, sheet header'],
] as const

const SIGNALS = [
  ['done', 'Verified, skill confirmed, course completed'],
  ['pending', 'Under review, invitation waiting'],
  ['attention', 'Needs re-upload, benefits paused'],
  ['info', 'Neutral info, grace period'],
] as const

// ---------------------------------------------------------------------------

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-hairline py-12">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="t-heading text-ink">{title}</h2>
        {note && <p className="max-w-[60ch] t-caption text-ink-2">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Swatch({ token, use }: { token: string; use: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-12 w-12 shrink-0 rounded-input border border-hairline shadow-1" style={{ background: `var(${token})` }} />
      <span>
        <span className="block t-caption text-ink tabular">{token}</span>
        <span className="block t-caption font-normal text-ink-2">{use}</span>
      </span>
    </div>
  )
}

function Spec({ name, meta, children }: { name: string; meta: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-hairline py-4 md:grid-cols-[180px_1fr] md:gap-6">
      <div>
        <p className="t-caption text-ink">{name}</p>
        <p className="t-micro text-ink-3 tabular">{meta}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function PhonePreview() {
  const { t } = useT()
  const scroller = useRef<HTMLDivElement>(null)
  const progress = useCollapseProgress(scroller)
  const [tab, setTab] = useState<StudentTab>('home')

  return (
    <div className="relative mx-auto h-[720px] w-[390px] max-w-full overflow-hidden rounded-[44px] border-[6px] border-ink bg-canvas shadow-3">
      <div ref={scroller} className="h-full overflow-y-auto pb-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-sunrise-wash" aria-hidden />
        <TopAppBar
          title={t('nav.home')}
          progress={progress}
          leading={<Avatar initials="MH" strength={72} size={36} label="Profile strength 72%" />}
          trailing={
            <IconButton label={t('nav.notifications')}>
              <Bell size={20} strokeWidth={1.5} />
            </IconButton>
          }
        />
        <LargeTitle progress={progress} eyebrow="Selamat pagi">
          Hi, <em>Hafiz</em>
        </LargeTitle>
        <div className="space-y-6 px-5">
          <NextStepCard label={t('home.nextStep.label')} action="A Talent Partner wants to talk." detail="Reply by Friday" actionLabel={t('action.reply')} />
          <PartnerRoleCard
            title="Logistics Executive"
            partnerName="Seri Mutiara Logistik Berhad"
            monogram="SM"
            location="Shah Alam, Selangor"
            salary={{ min: 3800, max: 4500 }}
            matchPct={86}
            skills={['Logistics coordination', 'Team leadership']}
            access="full"
          />
          <SkillCard name="Logistics coordination" level="advanced" evidenceCount={2} rationale="Planned supply distribution for 300 families over 2 years." />
          <Card>
            <SectionLabel>Scroll — glass needs content beneath it</SectionLabel>
            <div className="mt-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 rounded-full bg-surface-muted" style={{ width: `${90 - i * 9}%` }} />
              ))}
            </div>
          </Card>
        </div>
      </div>
      <TabBar active={tab} onSelect={setTab} position="absolute" />
    </div>
  )
}

function SkillRevealDemo() {
  const reduce = useReducedMotion()
  const [run, setRun] = useState(0)
  const skills = [
    { name: 'Logistics coordination', level: 'advanced' as const, n: 2, why: 'Planned supply distribution for 300 families over 2 years.' },
    { name: 'Team leadership', level: 'working' as const, n: 1, why: 'Led 25 volunteers in an exco role.' },
    { name: 'Stakeholder communication', level: 'working' as const, n: 1, why: 'Coordinated with district office and donors.' },
  ]

  return (
    <div className="on-sunrise relative overflow-hidden rounded-hero p-6 shadow-2" style={{ background: 'var(--sunrise)' }}>
      {/* slow shimmer over Sunrise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          animation: reduce ? undefined : 'shimmer 3.2s linear infinite',
        }}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <Chip tone="ink" icon={<Sparkles size={14} strokeWidth={1.5} />}>
            AI translation
          </Chip>
          <Button variant="secondary" size="sm" icon={<Play size={14} strokeWidth={1.5} />} onClick={() => setRun((r) => r + 1)}>
            Replay
          </Button>
        </div>
        <h3 className="mt-6 t-display-l text-ink">
          We found{' '}
          <em className="italic">
            <AnimatedNumber key={run} from={0} value={14} /> skills
          </em>
        </h3>
        <p className="mt-1 t-body text-ink-2">from 9 activities</p>
        <div key={run} className="mt-5 space-y-3">
          {skills.map((s, i) => (
            <motion.div
              key={s.name}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1], delay: 0.3 + i * STAGGER }}
            >
              <SkillCard name={s.name} level={s.level} evidenceCount={s.n} rationale={s.why} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function Styleguide() {
  const { t, lang, setLang } = useT()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [seg, setSeg] = useState<'partner' | 'open' | 'log'>('partner')
  const [visible, setVisible] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [pct, setPct] = useState(72)
  const spec = SPECIMEN[lang]

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const nav = [
    ['type', 'Type'],
    ['colour', 'Colour'],
    ['glass', 'Glass & shell'],
    ['buttons', 'Buttons & chips'],
    ['inputs', 'Inputs'],
    ['cards', 'Cards'],
    ['locked', 'Locked state'],
    ['sheet', 'Sheet'],
    ['motion', 'Motion'],
    ['agency', 'Agency'],
  ]

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* Toolbar */}
      <div className="glass sticky top-0 z-40 !rounded-none !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
          <p className="t-subheading">Styleguide</p>
          <Chip tone="pending" size="sm">Awaiting approval</Chip>
          <nav className="hidden flex-1 justify-center gap-4 xl:flex">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="whitespace-nowrap t-caption text-ink-2 hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setLang(lang === 'en' ? 'ms' : 'en')}>
              {lang === 'en' ? 'EN → BM' : 'BM → EN'}
            </Button>
            <IconButton label={dark ? 'Light mode' : 'Dark mode'} tone="surface" size={36} onClick={() => setDark((d) => !d)}>
              {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </IconButton>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <header className="py-14">
          <p className="t-label text-ink-2">PTPTN Graduate Platform · Phase 1a</p>
          <h1 className="mt-3 t-display-xl">
            Warm, calm, <em className="italic">quietly premium</em>
          </h1>
          <p className="mt-3 max-w-[62ch] t-body text-ink-2">
            Tokens, type and signature components from docs/visual-direction.md. Toggle BM to test heading lengths, and dark mode.
            Two families only: Instrument Serif for display, Inter for everything else. Everything below is built from the shared token set.
          </p>
        </header>

        {/* ------------------------------------------------------------ TYPE */}
        <Section id="type" title="Typography" note="Serif for at most two elements per screen; never on buttons, chips, labels or numbers. One italic serif word allowed for warmth.">
          <Spec name="Display XL" meta="Serif 44/46 · 400 · -0.01em">
            <p className="t-display-xl">{spec.displayXl}</p>
          </Spec>
          <Spec name="Display L" meta="Serif 34/38 · 400 · -0.01em">
            <p className="t-display-l">{spec.displayL}</p>
          </Spec>
          <Spec name="Title (app bar)" meta="Serif 30/34 · 400">
            <p className="t-title">{spec.title}</p>
          </Spec>
          <Spec name="Heading" meta="UI 20/26 · 600 · -0.015em">
            <p className="t-heading">{spec.heading}</p>
          </Spec>
          <Spec name="Subheading" meta="UI 17/24 · 600 · -0.01em">
            <p className="t-subheading">{spec.subheading}</p>
          </Spec>
          <Spec name="Body / Body strong" meta="UI 15/22 · 400 / 500">
            <p className="t-body">{spec.body}</p>
            <p className="t-body-strong">{spec.body}</p>
          </Spec>
          <Spec name="Caption" meta="UI 13/18 · 500">
            <p className="t-caption text-ink-2">{spec.caption}</p>
          </Spec>
          <Spec name="Micro / section label" meta="UI 11/14 · 500 · +0.02em">
            <p className="t-label text-ink-2">{spec.micro}</p>
          </Spec>
          <Spec name="Numbers" meta="tabular-nums">
            <p className="t-heading tabular">RM 3,800 – 4,500 · 86% · 14 skills · 07/10/2026</p>
          </Spec>
          <Spec name="Mobile width test" meta="360px column">
            <div className="w-[360px] max-w-full rounded-card border border-dashed border-hairline p-5">
              <p className="t-display-l">{spec.displayL}</p>
              <p className="mt-2 t-heading">{spec.heading}</p>
            </div>
          </Spec>
        </Section>

        {/* ---------------------------------------------------------- COLOUR */}
        <Section id="colour" title="Colour" note="Warm neutrals do most of the work. Toggle dark mode to see the dark column of the token table.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLOURS.map(([tok, use]) => (
              <Swatch key={tok} token={tok} use={use} />
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <SectionLabel>Signal colours — always chips with dark text</SectionLabel>
              <div className="mt-4 space-y-3">
                {SIGNALS.map(([tone, use]) => (
                  <div key={tone} className="flex items-center gap-4">
                    <Chip tone={tone} className="w-28 justify-center">
                      {tone}
                    </Chip>
                    <span className="t-caption font-normal text-ink-2">{use}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 t-caption font-normal text-ink-2">
                Repayment states never use red. Tier B = attention chip + a “ways back” action.
              </p>
            </div>
            <div>
              <SectionLabel>Sunrise — once per screen, max</SectionLabel>
              <div className="on-sunrise mt-4 grid h-40 place-items-end rounded-hero p-5 shadow-2" style={{ background: 'var(--sunrise)' }}>
                <p className="t-caption text-ink-2">Home hero · skills reveal · Tier A celebration · agency pulse</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ----------------------------------------------------------- GLASS */}
        <Section id="glass" title="Glass & app shell" note="Glass is chrome only: top bar on scroll, floating tab bar, desktop rail, sheet header. Scroll inside the phone to see the large title collapse.">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[auto_1fr]">
            <PhonePreview />
            <div className="space-y-6">
              <Card>
                <SectionLabel>Tab bar spec</SectionLabel>
                <ul className="mt-3 list-disc space-y-1 pl-5 t-body text-ink-2">
                  <li>Floating glass pill, inset 12px from edges, 12px above the safe area.</li>
                  <li>Active tab: ink pill behind icon and label. Inactive: icon + small label in ink-2.</li>
                  <li>Content scrolls beneath; a faint Sunrise wash at the top of Home gives the bar warmth to blur.</li>
                  <li>Desktop ≥1024px: centred 430px column with a frosted left rail replacing the tab bar (Phase 1b).</li>
                </ul>
              </Card>
              <div className="relative overflow-hidden rounded-card border border-hairline p-6" style={{ background: 'var(--sunrise)' }}>
                <div className="glass rounded-hero px-5 py-4">
                  <p className="t-body-strong text-ink">.glass over Sunrise</p>
                  <p className="t-caption font-normal text-ink-2">blur(24px) saturate(160%) · inset highlight · shadow-2</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Avatar initials="MH" strength={72} size={36} label="72%" />
                <Avatar initials="MH" strength={72} size={88} label="72%" />
                <p className="t-caption font-normal text-ink-2">Profile strength: thin ring in the top bar, fuller ring on the Profile tab.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* --------------------------------------------------------- BUTTONS */}
        <Section id="buttons" title="Buttons, chips, icons" note="Never more than one primary per screen.">
          <div className="flex flex-wrap items-center gap-4">
            <Button>{t('action.logApplication')}</Button>
            <Button variant="secondary">{t('action.useSample')}</Button>
            <Button variant="tertiary">{t('action.viewAll')}</Button>
            <Button loading>{t('action.continue')}</Button>
            <Button disabled>{t('action.continue')}</Button>
            <Button size="sm">{t('action.reply')}</Button>
            <Button size="sm" variant="secondary">
              {t('action.cancel')}
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Chip tone="done" icon={<CheckCircle2 size={14} strokeWidth={1.5} />}>{t('status.verified')}</Chip>
            <Chip tone="pending" icon={<Clock size={14} strokeWidth={1.5} />}>{t('status.underReview')}</Chip>
            <Chip tone="attention">{t('status.rejected')}</Chip>
            <Chip tone="info">{t('status.gracePeriod')}</Chip>
            <Chip tone="attention">{t('status.benefitsPaused')}</Chip>
            <Chip tone="ink">{t('status.talentPartner')}</Chip>
            <Chip tone="muted">Team leadership</Chip>
            <Chip tone="outline">KerjaKini</Chip>
            <Chip tone="done" size="sm">{t('status.verified')}</Chip>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <IconTile><BriefcaseBusiness size={20} strokeWidth={1.5} /></IconTile>
            <IconTile><UsersRound size={20} strokeWidth={1.5} /></IconTile>
            <IconTile><FileUp size={20} strokeWidth={1.5} /></IconTile>
            <LogoTile monogram="SM" />
            <LogoTile monogram="RA" />
            <LogoTile monogram="KK" />
            <MatchRing pct={86} label="86% match" />
            <div className="w-40">
              <LevelBar level="working" label="Working" />
            </div>
            <p className="t-caption font-normal text-ink-2">Lucide 1.5px / 20px · 36px icon tiles · 40px logo tiles</p>
          </div>
        </Section>

        {/* ---------------------------------------------------------- INPUTS */}
        <Section id="inputs" title="Inputs & controls" note="52px tall, muted surface, radius 14, floating label, ink 1.5px focus ring with 2px offset.">
          <div className="grid max-w-3xl gap-6 md:grid-cols-2">
            <Field label="Role applied for" defaultValue="Supply Chain Analyst" />
            <Field label="Company" hint="As it appears on the portal" />
            <Field label="Salary floor" prefix="RM" inputMode="numeric" defaultValue="3,200" />
            <Field label="IC number" error="Check the format: 000000-00-0000" defaultValue="9901" />
            <div className="md:col-span-2">
              <SegmentedControl
                ariaLabel={t('nav.opportunities')}
                value={seg}
                onChange={setSeg}
                options={[
                  { value: 'partner', label: 'Partner roles' },
                  { value: 'open', label: 'Open jobs' },
                  { value: 'log', label: 'My job search log' },
                ]}
              />
            </div>
            <Card className="md:col-span-2">
              <Toggle checked={visible} onChange={setVisible} label="Let Talent Partners find me" description="Employers see an anonymised profile until you accept contact." />
            </Card>
          </div>
        </Section>

        {/* ----------------------------------------------------------- CARDS */}
        <Section id="cards" title="Cards" note="Solid surfaces, hairline + shadow-1, radius 20. Hero is the only gradient surface on a screen.">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="max-w-app space-y-6">
              <SectionLabel>Hero card (Home)</SectionLabel>
              <HeroCard
                liveLabel={t('status.live')}
                icons={[<BriefcaseBusiness key="a" size={14} strokeWidth={1.5} />, <UsersRound key="b" size={14} strokeWidth={1.5} />]}
                headline={lang === 'en' ? <>2 partners <em>want to talk</em></> : <>2 rakan kongsi <em>ingin berbincang</em></>}
                body="Seri Mutiara and Rimba Agro viewed your profile this week."
                action={<Button>View invitations</Button>}
              />
              <SectionLabel>Next-step card</SectionLabel>
              <NextStepCard label={t('home.nextStep.label')} action="1 application needs better evidence." detail="Supply Chain Analyst · Rimba Agro" actionLabel={t('action.reupload')} />
              <SectionLabel>Skill card</SectionLabel>
              <SkillCard name="Team leadership" level="working" evidenceCount={1} rationale="Led 25 volunteers in an exco role." />
            </div>
            <div className="max-w-app space-y-6">
              <SectionLabel>Partner role card</SectionLabel>
              <PartnerRoleCard
                title="Graduate Trainee, Supply Chain"
                partnerName="Rimba Agro Berhad"
                monogram="RA"
                location="Kuching, Sarawak"
                salary={{ min: 3500, max: 4200 }}
                matchPct={78}
                skills={['Data analysis', 'Logistics coordination', 'Reporting']}
                access="full"
              />
              <SectionLabel>Job search log rows</SectionLabel>
              <Card padded={false} className="divide-y divide-hairline px-3 py-1">
                <JobLogRow portalMonogram="KK" role="Supply Chain Analyst" company="Rimba Agro Berhad" date="28 Sep" evidenceSrc="/evidence/portal-screenshot.svg" status="done" statusLabel={t('status.verified')} />
                <JobLogRow portalMonogram="SM" role="Logistics Executive" company="Seri Mutiara Logistik" date="2 Oct" evidenceSrc="/evidence/confirmation-email.svg" status="pending" statusLabel={t('status.underReview')} />
                <JobLogRow portalMonogram="LK" role="Operations Associate" company="Dian Retail Group" date="19 Sep" status="attention" statusLabel={t('status.rejected')} />
              </Card>
              <SectionLabel>Empty state</SectionLabel>
              <Card>
                <EmptyState title={t('empty.jobLog.title')} body={t('empty.jobLog.body')} action={<Button variant="secondary">{t('action.logApplication')}</Button>} />
              </Card>
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------- LOCKED */}
        <Section id="locked" title="Locked role" note="Below Tier A. Same card frosted over (40% glass, blur 8px) with a centred ink pill. No amounts, no status, no tier words — job surfaces only ever receive access: 'locked'.">
          <div className="grid max-w-4xl gap-6 md:grid-cols-2">
            <PartnerRoleCard
              title="Graduate Engineer, Grid Systems"
              partnerName="Cahaya Tenaga Berhad"
              monogram="CT"
              location="Johor Bahru, Johor"
              salary={{ min: 4200, max: 5200 }}
              matchPct={81}
              skills={['Technical reporting', 'Safety compliance']}
              access="locked"
            />
            <PartnerRoleCard
              title="Management Associate"
              partnerName="Selat Capital Berhad"
              monogram="SC"
              location="Kuala Lumpur"
              salary={{ min: 4500, max: 5500 }}
              matchPct={64}
              skills={['Financial analysis', 'Presentation']}
              access="locked"
            />
          </div>
        </Section>

        {/* ----------------------------------------------------------- SHEET */}
        <Section id="sheet" title="Bottom sheet" note="Secondary actions open as sheets. Spring 380/34, drag the handle to dismiss, Esc closes. Glass header only; body is solid.">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open “{t('action.logApplication')}” sheet
          </Button>
          <Sheet
            open={sheet}
            onClose={() => setSheet(false)}
            title={t('action.logApplication')}
            closeLabel={t('action.close')}
            footer={
              <Button block onClick={() => setSheet(false)}>
                {t('action.continue')}
              </Button>
            }
          >
            <div className="space-y-4">
              <Field label="Portal" defaultValue="KerjaKini" />
              <Field label="Role" />
              <Field label="Company" />
              <Card className="flex items-center gap-3 bg-surface-muted shadow-none">
                <IconTile className="bg-surface">
                  <FileUp size={20} strokeWidth={1.5} />
                </IconTile>
                <div className="flex-1">
                  <p className="t-body-strong">{t('action.uploadEvidence')}</p>
                  <p className="t-caption font-normal text-ink-2">Confirmation email, screenshot, interview invite or offer letter</p>
                </div>
              </Card>
            </div>
          </Sheet>
        </Section>

        {/* ---------------------------------------------------------- MOTION */}
        <Section id="motion" title="Motion" note="180–280ms, cubic-bezier(0.2, 0.8, 0.2, 1). Numbers tick up over 400ms. prefers-reduced-motion: fades only.">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="max-w-app">
              <SectionLabel className="mb-4">Skill reveal (onboarding)</SectionLabel>
              <SkillRevealDemo />
            </div>
            <div>
              <SectionLabel className="mb-4">Number tick-up</SectionLabel>
              <Card className="flex items-center gap-6">
                <MatchRing pct={pct} label={`${pct}%`} />
                <p className="t-display-l tabular">
                  <AnimatedNumber value={pct} />%
                </p>
                <Button variant="secondary" size="sm" onClick={() => setPct((p) => (p === 72 ? 91 : 72))}>
                  Change
                </Button>
              </Card>
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------- AGENCY */}
        <Section id="agency" title="Agency density preview" note="Same tokens, desktop-first and denser: 14px body, tables allowed, serif only for page titles. Full shell in Phase 1b.">
          <div className="overflow-hidden rounded-card border border-hairline bg-surface shadow-1">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="t-title">Job search evidence</h3>
              <Chip tone="attention">6 overdue</Chip>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] t-body-sm">
                <thead className="bg-surface-muted text-left">
                  <tr className="t-label text-ink-2">
                    {['Case', 'Subject', 'Reason', 'AI recommendation', 'Age', 'SLA'].map((h) => (
                      <th key={h} className="px-5 py-2.5 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {[
                    ['EV-20418', 'Student S-20418', 'Company not found', 'Escalate · 0.62', '4d', 'attention', 'Overdue'],
                    ['EV-20433', 'Student S-11872', 'Possible edited image', 'Reject · 0.71', '2d', 'pending', 'Due today'],
                    ['EV-20451', 'Student S-30215', 'Date out of period', 'Escalate · 0.58', '1d', 'done', 'On time'],
                  ].map(([id, subj, reason, ai, age, tone, sla]) => (
                    <tr key={id} className="hover:bg-surface-muted">
                      <td className="px-5 py-3 tabular text-ink-2">{id}</td>
                      <td className="px-5 py-3">{subj}</td>
                      <td className="px-5 py-3">{reason}</td>
                      <td className="px-5 py-3 tabular">{ai}</td>
                      <td className="px-5 py-3 tabular">{age}</td>
                      <td className="px-5 py-3">
                        <Chip tone={tone as 'attention' | 'pending' | 'done'} size="sm">
                          {sla}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <p className={cn('pt-6 t-caption font-normal text-ink-3')}>All names, companies and portals are fictional sample data.</p>
      </main>
    </div>
  )
}
