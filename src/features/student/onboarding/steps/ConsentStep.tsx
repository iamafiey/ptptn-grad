import { useState } from 'react'
import { Eye, Lock, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { IconTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import { recordConsent } from '@/services/students'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

const CONSENT_VERSION = 'PDPA-2026.1'

/** Step 2: plain-language PDPA card, one "I agree", link to full terms. */
export function ConsentStep({ state, next }: StepProps) {
  const { t } = useT()
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const rows = [
    { icon: Eye, title: 'onb.consent.pull.title', body: 'onb.consent.pull.body' },
    { icon: Lock, title: 'onb.consent.who.title', body: 'onb.consent.who.body' },
    { icon: SlidersHorizontal, title: 'onb.consent.control.title', body: 'onb.consent.control.body' },
  ] as const

  return (
    <OnboardingLayout
      stepId="consent"
      title={t('onboarding.consent.title')}
      lead={t('onb.consent.lead')}
      footer={
        <Button
          block
          loading={busy}
          onClick={async () => {
            setBusy(true)
            await recordConsent(state.student.id, CONSENT_VERSION)
            next()
          }}
        >
          {t('onb.consent.agree')}
        </Button>
      }
    >
      <Card className="divide-y divide-hairline p-0">
        {rows.map((r) => (
          <div key={r.title} className="flex gap-3 p-4">
            <IconTile>
              <r.icon size={20} strokeWidth={1.5} />
            </IconTile>
            <div>
              <p className="t-body-strong">{t(r.title)}</p>
              <p className="mt-0.5 t-body text-ink-2">{t(r.body)}</p>
            </div>
          </div>
        ))}
      </Card>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="tertiary" size="sm" onClick={() => setTerms(true)}>
          {t('onb.consent.terms')}
        </Button>
        <span className="t-micro text-ink-3">{t('onb.consent.version', { v: CONSENT_VERSION })}</span>
      </div>
      <Sheet open={terms} onClose={() => setTerms(false)} title={t('onb.consent.termsTitle')} closeLabel={t('action.close')}>
        <p className="t-body text-ink-2">{t('onb.consent.termsBody')}</p>
      </Sheet>
    </OnboardingLayout>
  )
}
