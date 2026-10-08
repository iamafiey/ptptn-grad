import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Note } from '@/components/ui/Note'
import { useT } from '@/i18n'
import type { OfficerRole } from '@/types/domain'

const ALLOWED: OfficerRole[] = ['collectionLiaison', 'customerServiceAgent', 'superAdmin']

/** Repayment fields render only for the collection liaison and super admin; everyone else sees a lock note. */
export function RepaymentGate({ role, children, quiet }: { role: OfficerRole; children: ReactNode; quiet?: boolean }) {
  const { t } = useT()
  if (ALLOWED.includes(role)) return <>{children}</>
  if (quiet) return null
  return (
    <Note tone="muted" icon={<Lock size={14} strokeWidth={1.5} />}>
      {t('ti.restricted')}
    </Note>
  )
}
