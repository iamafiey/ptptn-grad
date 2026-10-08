import { PhasePlaceholder } from '@/components/PhasePlaceholder'
import { useT } from '@/i18n'
import type { I18nKey } from '@/i18n/en'
import type { LocalizedText } from '@/types/domain'
import { StudentPage } from '../shell/StudentPage'

// Phase 1b stand-ins for every student screen. Each is replaced by its real screen in later phases.
const PAGES: Record<string, { title: I18nKey; phase: number; plan: LocalizedText[] }> = {
  learn: { title: 'student.learn.title', phase: 4, plan: [{ en: 'In progress, Recommended for your gaps, Completed, Browse all.' }] },
  gap: { title: 'student.gap.title', phase: 4, plan: [{ en: 'Current → target level, “Unlocks 12 more matches”, 2–4 course options.' }] },
  repayment: {
    title: 'student.repayment.title',
    phase: 4,
    plan: [{ en: 'Standing badge, benefits earned, last 6 payments, Pay now hand-off.' }, { en: 'Ways back to Tier A when behind.' }],
  },
}

export function StudentPlaceholder({ page }: { page: keyof typeof PAGES }) {
  const { t } = useT()
  const meta = PAGES[page]
  return (
    <StudentPage title={t(meta.title)}>
      <PhasePlaceholder phase={meta.phase} items={meta.plan} />
    </StudentPage>
  )
}

export const LearnPage = () => <StudentPlaceholder page="learn" />
export const GapPage = () => <StudentPlaceholder page="gap" />
export const RepaymentPage = () => <StudentPlaceholder page="repayment" />
