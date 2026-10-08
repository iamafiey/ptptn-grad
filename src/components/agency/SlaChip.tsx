import { Chip } from '@/components/ui/Chip'
import { useT } from '@/i18n'
import type { Sla } from '@/services/agencyQueues'

export function SlaChip({ sla }: { sla: Sla }) {
  const { t } = useT()
  const tone = sla === 'overdue' ? 'attention' : sla === 'dueToday' ? 'pending' : 'done'
  return (
    <Chip tone={tone} size="sm">
      {t(`ag.sla.${sla}`)}
    </Chip>
  )
}
