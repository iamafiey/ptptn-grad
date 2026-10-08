import type { ChipTone } from '@/components/ui/Chip'
import type { TalentPartner } from '@/types/domain'

export const STATUS_TONE: Record<string, ChipTone> = { active: 'done', probation: 'pending', onboarding: 'info', paused: 'attention', ended: 'muted' }

export const partnerStatusKey = (p: TalentPartner) => (p.status === 'active' && p.onboardingStage === 'probation' ? 'probation' : p.status)

export const STAGE_TONE: Record<'onboarding' | 'visible' | 'talking' | 'offer' | 'hired', ChipTone> = { onboarding: 'muted', visible: 'info', talking: 'pending', offer: 'pending', hired: 'done' }
