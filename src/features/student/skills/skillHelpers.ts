import type { ScoredSkill } from '@/types/domain'
import type { ChipTone } from '@/components/ui/Chip'
import type { I18nKey } from '@/i18n/en'

/** Status chip for a skill, or null when it's simply kept. */
export function statusChip(s: ScoredSkill): { tone: ChipTone; key: I18nKey } | null {
  switch (s.status) {
    case 'hidden':
      return { tone: 'muted', key: 'skill.status.hidden' }
    case 'disputed':
      return { tone: 'pending', key: 'skill.status.disputed' }
    case 'loweredByStudent':
      return { tone: 'info', key: 'skill.status.lowered' }
    case 'studentAdded':
      return { tone: 'info', key: 'skill.status.added' }
    default:
      return null
  }
}

/** Evidence chips count real sources (activities, files, transcript). */
export function evidenceCount(s: ScoredSkill) {
  return s.evidenceIds.length
}
