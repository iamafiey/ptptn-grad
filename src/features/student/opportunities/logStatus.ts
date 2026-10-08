import type { ChipTone } from '@/components/ui/Chip'
import type { LogRowStatus } from '@/components/student/JobLogRow'
import type { I18nKey } from '@/i18n/en'
import type { LogStatus } from '@/types/domain'

export function statusOf(s: LogStatus): { tone: ChipTone; row: LogRowStatus; key: I18nKey } {
  switch (s) {
    case 'verified':
      return { tone: 'done', row: 'done', key: 'status.verified' }
    case 'underReview':
      return { tone: 'pending', row: 'pending', key: 'status.underReview' }
    case 'checking':
      return { tone: 'pending', row: 'pending', key: 'status.checking' }
    case 'rejected':
      return { tone: 'attention', row: 'attention', key: 'status.rejected' }
    default:
      return { tone: 'attention', row: 'attention', key: 'status.pendingEvidence' }
  }
}
