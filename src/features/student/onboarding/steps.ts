import type { I18nKey } from '@/i18n/en'
import type { LocalizedText } from '@/types/domain'

// docs/student-dashboard-flow.md §Onboarding (steps 1–10; step 11 lands on Home).
// `plan` lists are temporary placeholder copy, replaced when each step is built in Phase 2.
export const ONBOARDING_STEPS: { id: string; title: I18nKey; plan: LocalizedText[] }[] = [
  { id: 'signin', title: 'onboarding.signin.title', plan: [{ en: 'MyDigital ID, or IC number + PTPTN account number with OTP (simulated).' }] },
  { id: 'consent', title: 'onboarding.consent.title', plan: [{ en: 'Plain-language PDPA card: what is pulled, who sees it, anonymised employer view.' }, { en: 'Single “I agree”, link to full terms.' }] },
  { id: 'confirm', title: 'onboarding.confirm.title', plan: [{ en: 'Auto-filled from the PTPTN loan record: institution, programme, graduation year, CGPA band.' }, { en: '“Looks right” or edit.' }] },
  { id: 'academic', title: 'onboarding.academic.title', plan: [{ en: 'Upload transcript (PDF or photo), or pull from the university when the setting allows.' }, { en: 'AI extracts courses, final-year project and grades.' }] },
  { id: 'activities', title: 'onboarding.activities.title', plan: [{ en: 'Guided cards, one activity at a time, with example prompts and evidence.' }, { en: 'Part-time work, internships, competitions, freelance. “Skip for now” shows the profile-strength cost.' }] },
  { id: 'preferences', title: 'onboarding.preferences.title', plan: [{ en: 'Role interests, preferred states, relocation, salary floor (RM), earliest start.' }] },
  { id: 'translating', title: 'onboarding.translating.title', plan: [{ en: '10–20 second staged AI progress: “Reading your transcript… Mapping 6 activities to skills…”' }] },
  { id: 'reveal', title: 'onboarding.reveal.title', plan: [{ en: '“We found 14 skills from 9 activities.” Staggered skill cards over the Sunrise shimmer.' }] },
  { id: 'review', title: 'onboarding.review.title', plan: [{ en: 'Keep, Edit level down, Hide, or “This isn’t right” per skill. Add a missing skill (Foundation until evidenced).' }] },
  { id: 'visible', title: 'onboarding.visible.title', plan: [{ en: '“Let Talent Partners find me” (default on) with a preview of exactly what employers see.' }] },
]
