import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Building2, FileUp, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { IconTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import { uploadTranscript } from '@/services/students'
import { useDemo } from '@/state/DemoProvider'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

function SourceOption({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-card border border-hairline bg-surface p-4 text-left shadow-1 transition-colors hover:bg-surface-muted">
      <IconTile>{icon}</IconTile>
      <span>
        <span className="block t-body-strong">{label}</span>
        <span className="block t-caption font-normal text-ink-2">{hint}</span>
      </span>
    </button>
  )
}

/** Step 4: upload a transcript (or pull from the university when the setting allows). AI extracts courses and FYP. */
export function AcademicStep({ state, next }: StepProps) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const { settings } = useDemo()
  const file = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const academic = state.academic
  const hasTranscript = state.evidence.some((e) => e.kind === 'transcript') || academic?.source === 'integration'

  const pickFile = () => file.current?.click()

  const run = async (name: string) => {
    setReading(true)
    await uploadTranscript(state.student.id, name)
    setReading(false)
  }

  return (
    <OnboardingLayout
      stepId="academic"
      title={t('onboarding.academic.title')}
      lead={t('onb.academic.lead')}
      footer={
        <Button block disabled={!hasTranscript || reading} onClick={next}>
          {t('action.continue')}
        </Button>
      }
    >
      <input
        ref={file}
        type="file"
        accept="application/pdf,image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) run(f.name)
        }}
      />

      {reading ? (
        <Card className="py-10 text-center">
          <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-sm bg-hairline" aria-hidden>
            <motion.div className="h-full w-1/3 bg-ink" animate={reduce ? { opacity: [0.4, 1] } : { x: ['-100%', '300%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <p className="mt-4 t-body text-ink-2" role="status">
            {t('onb.academic.reading')}
          </p>
        </Card>
      ) : hasTranscript && academic ? (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <p className="t-subheading">{t('onb.academic.found', { count: academic.courses.length })}</p>
              <Chip tone="done" size="sm">
                {t('status.verified')}
              </Chip>
            </div>
            <ul className="mt-3 divide-y divide-hairline">
              {academic.courses.map((c) => (
                <li key={c.code} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate t-body">{c.name}</span>
                    <span className="block t-micro text-ink-3 tabular">{c.code}</span>
                  </span>
                  <Chip tone="muted" size="sm">
                    {c.grade}
                  </Chip>
                </li>
              ))}
            </ul>
            {academic.finalYearProject && (
              <div className="mt-3 rounded-control bg-surface-muted p-3">
                <p className="t-caption text-ink-2">{t('onb.academic.fyp')}</p>
                <p className="t-body-strong">{academic.finalYearProject.title}</p>
              </div>
            )}
          </Card>
          <Button variant="tertiary" size="sm" onClick={pickFile}>
            {t('onb.academic.replace')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {settings.records.universitySource === 'integration' && (
            <SourceOption icon={<Building2 size={20} strokeWidth={1.5} />} label={t('onb.academic.pull')} hint={t('onb.academic.pullHint')} onClick={() => run('University registry')} />
          )}
          <SourceOption icon={<FileUp size={20} strokeWidth={1.5} />} label={t('onb.academic.upload')} hint={t('onb.academic.uploadHint')} onClick={pickFile} />
          <SourceOption icon={<GraduationCap size={20} strokeWidth={1.5} />} label={t('onb.academic.sample')} hint="Transkrip-sample.pdf" onClick={() => run('Transkrip-sample.pdf')} />
        </div>
      )}
    </OnboardingLayout>
  )
}
