import { BriefcaseBusiness, GraduationCap, House, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react'
import type { I18nKey } from '@/i18n/en'

export type StudentTab = 'home' | 'profile' | 'opportunities' | 'learn' | 'repayment'

export const STUDENT_TABS: { id: StudentTab; icon: LucideIcon; label: I18nKey }[] = [
  { id: 'home', icon: House, label: 'nav.home' },
  { id: 'profile', icon: UserRound, label: 'nav.profile' },
  { id: 'opportunities', icon: BriefcaseBusiness, label: 'nav.opportunities' },
  { id: 'learn', icon: GraduationCap, label: 'nav.learn' },
  { id: 'repayment', icon: ShieldCheck, label: 'nav.repayment' },
]
