import type { Officer } from '@/types/domain'

// One fictional officer per agency role.
export const officers: Officer[] = [
  { id: 'off-sa', name: 'Encik Azlan Mokhtar', role: 'superAdmin', initials: 'AM' },
  { id: 'off-po', name: 'Puan Rosnah Ismail', role: 'programmeOfficer', initials: 'RI' },
  { id: 'off-pm', name: 'Cik Mei Ling Tan', role: 'partnershipManager', initials: 'MT' },
  { id: 'off-ai', name: 'Dr. Harith Zulkifli', role: 'aiGovernanceLead', initials: 'HZ' },
  { id: 'off-lm', name: 'Puan Saraswathy Nair', role: 'learningManager', initials: 'SN' },
  { id: 'off-cl', name: 'Encik Faizal Hamdan', role: 'collectionLiaison', initials: 'FH' },
  { id: 'off-lv', name: 'Datin Norhayati Osman', role: 'leadershipViewer', initials: 'NO' },
]
