import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { OfficerRole } from '@/types/domain'

/** Amounts: collection liaison and super admin always; customer service agents when the programme allows it. */
export function seesAmounts(role: OfficerRole, s: ProgrammeSettings) {
  return role === 'collectionLiaison' || role === 'superAdmin' || (role === 'customerServiceAgent' && s.collections.agentsSeeAmounts)
}
