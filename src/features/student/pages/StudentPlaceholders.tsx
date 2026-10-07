import { PhasePlaceholder } from '@/components/PhasePlaceholder'
import { Rich } from '@/i18n/Rich'
import { useT } from '@/i18n'
import { getPersona } from '@/services/demo'
import { useDemo } from '@/state/DemoProvider'
import type { I18nKey } from '@/i18n/en'
import type { LocalizedText } from '@/types/domain'
import { StudentPage } from '../shell/StudentPage'

// Phase 1b stand-ins for every student screen. Each is replaced by its real screen in later phases.
const PAGES: Record<string, { title: I18nKey; phase: number; plan: LocalizedText[] }> = {
  home: {
    title: 'student.home.title',
    phase: 3,
    plan: [
      { en: 'Hero card and one “Your next step”.' },
      { en: 'Partner interest, partner roles (locked below Tier A), job search this month, open jobs.' },
      { en: 'Skill snapshot with a gap callout, keep learning, repayment standing.' },
    ],
  },
  profile: {
    title: 'student.profile.title',
    phase: 2,
    plan: [
      { en: 'AI summary, skills grouped by category, activities timeline linked to skills.' },
      { en: '“See as employer” anonymised view and “Download my skill CV”.' },
    ],
  },
  cv: { title: 'student.cv.title', phase: 2, plan: [{ en: 'Print-ready skill CV (anonymised or named) and a shareable link.' }] },
  opportunities: {
    title: 'student.opportunities.title',
    phase: 3,
    plan: [{ en: 'Partner roles · Open jobs · My job search log.' }, { en: 'Log an application with evidence; AI checks it.' }],
  },
  learn: { title: 'student.learn.title', phase: 4, plan: [{ en: 'In progress, Recommended for your gaps, Completed, Browse all.' }] },
  gap: { title: 'student.gap.title', phase: 4, plan: [{ en: 'Current → target level, “Unlocks 12 more matches”, 2–4 course options.' }] },
  repayment: {
    title: 'student.repayment.title',
    phase: 4,
    plan: [{ en: 'Standing badge, benefits earned, last 6 payments, Pay now hand-off.' }, { en: 'Ways back to Tier A when behind.' }],
  },
  notifications: { title: 'student.notifications.title', phase: 3, plan: [{ en: 'Invitations, interviews, evidence checks, re-scores, payment reminders.' }] },
}

function greetingKey(): I18nKey {
  const h = new Date().getHours()
  return h < 12 ? 'greeting.morning' : h < 19 ? 'greeting.afternoon' : 'greeting.evening'
}

export function StudentPlaceholder({ page }: { page: keyof typeof PAGES }) {
  const { t } = useT()
  const { personaId } = useDemo()
  const meta = PAGES[page]
  const isHome = page === 'home'
  return (
    <StudentPage
      title={t(meta.title)}
      wash={isHome}
      eyebrow={isHome ? t(greetingKey()) : undefined}
      heading={isHome ? <Rich text={t('greeting.hi', { name: getPersona(personaId).preferredName })} /> : undefined}
    >
      <PhasePlaceholder phase={meta.phase} items={meta.plan} />
    </StudentPage>
  )
}

export const HomePage = () => <StudentPlaceholder page="home" />
export const ProfilePage = () => <StudentPlaceholder page="profile" />
export const CvPage = () => <StudentPlaceholder page="cv" />
export const OpportunitiesPage = () => <StudentPlaceholder page="opportunities" />
export const LearnPage = () => <StudentPlaceholder page="learn" />
export const GapPage = () => <StudentPlaceholder page="gap" />
export const RepaymentPage = () => <StudentPlaceholder page="repayment" />
export const NotificationsPage = () => <StudentPlaceholder page="notifications" />
