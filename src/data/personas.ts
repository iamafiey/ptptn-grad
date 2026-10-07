import type { ID, LocalizedText } from '@/types/domain'

// The three demo students (BUILD_PLAN.md §7). Full records arrive in Phase 2.
export interface DemoPersona {
  id: ID
  fullName: string
  preferredName: string
  initials: string
  institution: string
  state: LocalizedText
  /** Where the student app opens for this persona. */
  homePath: string
  profileStrength: number
}

export const personas: DemoPersona[] = [
  {
    id: 'nurul',
    fullName: 'Nurul Aina binti Rahman',
    preferredName: 'Aina',
    initials: 'NA',
    institution: 'UiTM Shah Alam',
    state: { en: 'Mid-onboarding', ms: 'Sedang mendaftar' },
    homePath: '/s/onboarding/activities',
    profileStrength: 35,
  },
  {
    id: 'hafiz',
    fullName: 'Muhammad Hafiz bin Azman',
    preferredName: 'Hafiz',
    initials: 'MH',
    institution: 'UKM',
    state: { en: 'Visible · grace period · 2 invitations', ms: 'Boleh dilihat · tempoh tangguh · 2 jemputan' },
    homePath: '/s/home',
    profileStrength: 82,
  },
  {
    id: 'kavitha',
    fullName: 'Kavitha a/p Ramasamy',
    preferredName: 'Kavitha',
    initials: 'KR',
    institution: 'UTHM',
    state: { en: 'Behind · benefits paused', ms: 'Tertunggak · manfaat digantung' },
    homePath: '/s/home',
    profileStrength: 74,
  },
]
