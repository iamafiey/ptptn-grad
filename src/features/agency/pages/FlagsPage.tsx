import { AlertTriangle, Copy, TrendingUp, UserX } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { listFlags } from '@/services/studentsAdmin'
import type { AccountFlag } from '@/types/domain'
import { AgencyPage } from '../shell/AgencyPage'

const ICON: Record<AccountFlag['kind'], typeof AlertTriangle> = { duplicateIC: UserX, reusedEvidence: Copy, scoreJump: TrendingUp, partnerReport: AlertTriangle }

/** Flagged accounts: possible misuse surfaced by checks and partner reports. */
export default function FlagsPage() {
  const { t, lang } = useT()
  const { data } = useAsync(() => listFlags(), [])
  return (
    <AgencyPage title={t('agency.nav.flags')} description={t('fl.lead')}>
      <Card padded={false} className="divide-y divide-hairline">
        {(data ?? []).map((f) => {
          const I = ICON[f.kind]
          return (
            <div key={f.id} className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-control bg-attention text-attention-ink" aria-hidden>
                <I size={16} strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="t-body-strong">
                  {t(`fl.kind.${f.kind}`)} · <span className="tabular text-ink-2">{f.studentId}</span>
                </p>
                <p className="t-body-sm text-ink-2">{f.detail}</p>
                <p className="mt-1 t-caption font-normal text-ink-3">
                  {f.id} · {t('fl.raised', { date: formatDate(f.raisedAt, lang, 'long') })}
                </p>
              </div>
            </div>
          )
        })}
      </Card>
    </AgencyPage>
  )
}
