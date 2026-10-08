import { useRef, useState } from 'react'
import { Fingerprint, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { IconTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

/** Step 1: MyDigital ID, or IC + PTPTN account number with OTP (simulated). */
export function SignInStep({ next }: StepProps) {
  const { t } = useT()
  const [connecting, setConnecting] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [otpStage, setOtpStage] = useState(false)
  const [ic, setIc] = useState('040312-10-5812')
  const [acct, setAcct] = useState('PT2207-118420')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const boxes = useRef<(HTMLInputElement | null)[]>([])

  const mydigital = () => {
    setConnecting(true)
    setTimeout(next, 1200)
  }

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const copy = [...otp]
    copy[i] = d
    setOtp(copy)
    if (d && i < 5) boxes.current[i + 1]?.focus()
  }

  return (
    <OnboardingLayout
      stepId="signin"
      title={t('onboarding.signin.title')}
      lead={t('onb.signin.lead')}
      footer={
        <div className="space-y-2">
          <Button block loading={connecting} icon={<Fingerprint size={18} strokeWidth={1.5} />} onClick={mydigital}>
            {connecting ? t('onb.signin.connecting') : t('onb.signin.mydigital')}
          </Button>
          <Button block variant="secondary" onClick={() => setSheet(true)}>
            {t('onb.signin.alt')}
          </Button>
        </div>
      }
    >
      <Card className="space-y-4">
        {[
          [Zap, 'onb.consent.pull.title', 'onb.consent.pull.body'],
          [ShieldCheck, 'onb.consent.who.title', 'onb.consent.who.body'],
          [SlidersHorizontal, 'onb.consent.control.title', 'onb.consent.control.body'],
        ].map(([Icon, title, body]) => {
          const I = Icon as typeof Zap
          return (
            <div key={title as string} className="flex gap-3">
              <IconTile>
                <I size={20} strokeWidth={1.5} />
              </IconTile>
              <div>
                <p className="t-body-strong">{t(title as 'explain.map.title')}</p>
                <p className="t-caption font-normal text-ink-2">{t(body as 'explain.map.body')}</p>
              </div>
            </div>
          )
        })}
      </Card>

      <Sheet
        open={sheet}
        onClose={() => {
          setSheet(false)
          setOtpStage(false)
        }}
        title={otpStage ? t('onb.otp.title') : t('onb.signin.alt')}
        closeLabel={t('action.close')}
        footer={
          otpStage ? (
            <Button block disabled={otp.join('').length < 6} onClick={next}>
              {t('onb.otp.verify')}
            </Button>
          ) : (
            <Button block disabled={!ic || !acct} onClick={() => setOtpStage(true)}>
              {t('onb.signin.sendOtp')}
            </Button>
          )
        }
      >
        {!otpStage ? (
          <div className="space-y-4">
            <Field label={t('onb.signin.ic')} value={ic} onChange={(e) => setIc(e.target.value)} inputMode="numeric" />
            <Field label={t('onb.signin.account')} value={acct} onChange={(e) => setAcct(e.target.value)} />
          </div>
        ) : (
          <div>
            <p className="t-body text-ink-2">{t('onb.otp.body')}</p>
            <div className="mt-5 flex justify-between gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxes.current[i] = el
                  }}
                  value={d}
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  aria-label={t('onb.otp.digit', { n: i + 1 })}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && boxes.current[i - 1]?.focus()}
                  className="h-14 w-full min-w-0 rounded-control bg-surface-muted text-center t-heading tabular focus:outline focus:outline-[1.5px] focus:outline-ink focus:outline-offset-2"
                />
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </OnboardingLayout>
  )
}
