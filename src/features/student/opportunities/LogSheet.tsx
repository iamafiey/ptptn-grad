import { useRef, useState } from 'react'
import { CheckCircle2, Clock, FileUp, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { IconTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import { listEvidenceSamples, type EvidenceInput } from '@/services/evidenceCheck'
import { listPortals } from '@/services/jobs'
import { attachEvidence, logApplication } from '@/services/jobLog'
import { useDemo } from '@/state/DemoProvider'
import type { EvidenceCheckResult } from '@/types/domain'
import { CheckDetails, CheckProgress } from './EvidenceCheck'

type Step = 'details' | 'evidence' | 'checking' | 'result'

/**
 * "I applied" → portal and role → evidence → AI check → result.
 * With `entryId`, it starts at the evidence step (add or re-upload evidence for an existing entry).
 */
export function LogSheet({ studentId, entryId, open, onClose }: { studentId: string; entryId?: string | null; open: boolean; onClose: () => void }) {
  const { t, lt } = useT()
  const { settings } = useDemo()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(entryId ? 'evidence' : 'details')
  const [id, setId] = useState<string | null>(entryId ?? null)
  const [portal, setPortal] = useState('kerjakini')
  const [otherName, setOtherName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [date, setDate] = useState('2026-10-07')
  const [stage, setStage] = useState(0)
  const [result, setResult] = useState<EvidenceCheckResult | null>(null)

  const portals = listPortals()
  const close = () => {
    onClose()
    setTimeout(() => {
      setStep(entryId ? 'evidence' : 'details')
      setId(entryId ?? null)
      setRole('')
      setCompany('')
      setResult(null)
      setStage(0)
    }, 300)
  }

  const createEntry = async () => {
    const p = portals.find((x) => x.id === portal)
    const newId = await logApplication(studentId, { portalId: p?.id, portalName: p?.name ?? (otherName.trim() || t('log.portal.other')), role, company, appliedAt: date })
    setId(newId)
    setStep('evidence')
  }

  const run = async (input: EvidenceInput, objectUrl?: string) => {
    if (!id) return
    setStep('checking')
    const r = await attachEvidence(studentId, id, input, settings, setStage, objectUrl)
    setResult(r)
    setStep('result')
  }

  const footer =
    step === 'details' ? (
      <Button block disabled={!role.trim() || !company.trim() || (portal === 'other' && !otherName.trim())} onClick={createEntry}>
        {t('log.next')}
      </Button>
    ) : step === 'result' ? (
      result?.decision === 'rejected' ? (
        <Button block icon={<RotateCcw size={16} strokeWidth={1.5} />} onClick={() => setStep('evidence')}>
          {t('log.reupload')}
        </Button>
      ) : (
        <Button block onClick={close}>
          {t('action.done')}
        </Button>
      )
    ) : undefined

  return (
    <Sheet open={open} onClose={close} title={step === 'details' ? t('log.title') : t('log.evidenceTitle')} closeLabel={t('action.close')} footer={footer}>
      {step === 'details' && (
        <div className="space-y-4">
          <Select
            label={t('log.portal')}
            value={portal}
            onChange={(e) => setPortal(e.target.value)}
            options={[...portals.map((p) => ({ value: p.id, label: p.name })), { value: 'other', label: t('log.portal.other') }]}
          />
          {portal === 'other' && <Field label={t('log.portalName')} value={otherName} onChange={(e) => setOtherName(e.target.value)} />}
          <Field label={t('log.role')} value={role} onChange={(e) => setRole(e.target.value)} />
          <Field label={t('log.company')} value={company} onChange={(e) => setCompany(e.target.value)} />
          <Field label={t('log.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      )}

      {step === 'evidence' && (
        <div className="space-y-4">
          <p className="t-body text-ink-2">{t('log.evidenceLead')}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf,.eml"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) run({ fileName: f.name, size: f.size }, f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined)
            }}
          />
          <Button variant="secondary" block icon={<FileUp size={18} strokeWidth={1.5} />} onClick={() => fileRef.current?.click()}>
            {t('log.upload')}
          </Button>
          <p className="pt-2 t-label text-ink-2">{t('log.samples')}</p>
          <ul className="space-y-2">
            {listEvidenceSamples().map((s) => (
              <li key={s.id}>
                <button onClick={() => run({ sampleId: s.id })} className="flex w-full items-center gap-3 rounded-control border border-hairline bg-surface p-2 text-left hover:bg-surface-muted">
                  <img src={s.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-chip border border-hairline object-cover object-top" />
                  <span className="min-w-0">
                    <span className="block t-body-strong">{lt(s.label)}</span>
                    <span className="block t-caption font-normal text-ink-2">{lt(s.description)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 'checking' && <CheckProgress stage={stage} />}

      {step === 'result' && result && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <IconTile className={result.decision === 'autoVerified' ? 'bg-done text-done-ink' : result.decision === 'escalated' ? 'bg-pending text-pending-ink' : 'bg-attention text-attention-ink'}>
              {result.decision === 'autoVerified' ? <CheckCircle2 size={20} strokeWidth={1.5} /> : result.decision === 'escalated' ? <Clock size={20} strokeWidth={1.5} /> : <RotateCcw size={20} strokeWidth={1.5} />}
            </IconTile>
            <p className="t-heading" role="status">
              {t(result.decision === 'autoVerified' ? 'log.result.verified' : result.decision === 'escalated' ? 'log.result.review' : 'log.result.rejected')}
            </p>
          </div>
          {result.decision === 'autoVerified' && <Note tone="done">{t('log.result.verifiedBody')}</Note>}
          {result.decision === 'escalated' && <Note tone="pending">{t('log.result.reviewBody')}</Note>}
          <CheckDetails result={result} />
        </div>
      )}
    </Sheet>
  )
}
