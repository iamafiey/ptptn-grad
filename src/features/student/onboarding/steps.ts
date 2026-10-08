import type { I18nKey } from '@/i18n/en'

// docs/student-dashboard-flow.md §Onboarding (steps 1–10; step 11 lands on Home).
export const ONBOARDING_STEPS: { id: string; title: I18nKey }[] = [
  { id: 'signin', title: 'onboarding.signin.title' },
  { id: 'consent', title: 'onboarding.consent.title' },
  { id: 'confirm', title: 'onboarding.confirm.title' },
  { id: 'academic', title: 'onboarding.academic.title' },
  { id: 'activities', title: 'onboarding.activities.title' },
  { id: 'preferences', title: 'onboarding.preferences.title' },
  { id: 'translating', title: 'onboarding.translating.title' },
  { id: 'reveal', title: 'onboarding.reveal.title' },
  { id: 'review', title: 'onboarding.review.title' },
  { id: 'visible', title: 'onboarding.visible.title' },
]
