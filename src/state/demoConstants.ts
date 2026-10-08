import type { OfficerRole } from '@/types/domain'

export type AppRole = 'student' | 'agency'
export const PERSONA_IDS = ['nurul', 'hafiz', 'kavitha'] as const
export type PersonaId = (typeof PERSONA_IDS)[number]
export const OFFICER_ROLES: OfficerRole[] = [
  'superAdmin',
  'programmeOfficer',
  'partnershipManager',
  'aiGovernanceLead',
  'learningManager',
  'collectionLiaison',
  'customerServiceAgent',
  'leadershipViewer',
]
