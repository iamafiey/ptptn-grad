import type { ID, LocalizedText } from '@/types/domain'

// The three demo students (BUILD_PLAN.md §7): switcher metadata. Full records live in data/students.ts.
export interface DemoPersona {
  id: ID
  fullName: string
  preferredName: string
  initials: string
  institution: string
  state: LocalizedText
}

export const personas: DemoPersona[] = [
  {
    id: 'nurul',
    fullName: 'Nurul Aina binti Rahman',
    preferredName: 'Aina',
    initials: 'NA',
    institution: 'UiTM Shah Alam',
    state: { en: 'Mid-onboarding', ms: 'Sedang mendaftar' },
  },
  {
    id: 'hafiz',
    fullName: 'Muhammad Hafiz bin Azman',
    preferredName: 'Hafiz',
    initials: 'MH',
    institution: 'UKM',
    state: { en: 'Visible · grace period · 2 invitations', ms: 'Boleh dilihat · tempoh tangguh · 2 jemputan' },
  },
  {
    id: 'kavitha',
    fullName: 'Kavitha a/p Ramasamy',
    preferredName: 'Kavitha',
    initials: 'KR',
    institution: 'UTHM',
    state: { en: 'Behind · benefits paused', ms: 'Tertunggak · manfaat digantung' },
  },
]
