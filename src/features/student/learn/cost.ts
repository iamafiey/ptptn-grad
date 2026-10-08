import type { useT } from '@/i18n'
import { formatRM } from '@/lib/format'
import type { CourseView } from '@/services/courses'

export function costLabel(t: ReturnType<typeof useT>['t'], c: Pick<CourseView, 'cost' | 'costRM'>) {
  return c.cost === 'free' ? t('learn.cost.free') : t(`learn.cost.${c.cost}`, { price: formatRM(c.costRM ?? 0) })
}
