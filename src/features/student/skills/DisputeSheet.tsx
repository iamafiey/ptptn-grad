import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Sheet } from '@/components/ui/Sheet'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n'
import { disputeSkill } from '@/services/students'

type Reason = 'level' | 'notMine' | 'evidence'

/** "This isn't right": hides the skill from employers and sends it to the AI governance queue. */
export function DisputeSheet({ studentId, skillId, skillName, open, onClose }: { studentId: string; skillId: string; skillName: string; open: boolean; onClose: () => void }) {
  const { t } = useT()
  const toast = useToast()
  const [reason, setReason] = useState<Reason[]>(['level'])
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    const res = await disputeSkill(studentId, skillId, reason[0], comment)
    setBusy(false)
    onClose()
    toast(t('dispute.sent', { id: res.caseId }))
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('dispute.title')}
      closeLabel={t('action.close')}
      footer={
        <Button block loading={busy} onClick={send}>
          {t('dispute.send')}
        </Button>
      }
    >
      <p className="t-body-strong">{skillName}</p>
      <p className="mt-4 mb-2 t-caption text-ink-2">{t('dispute.reason')}</p>
      <ChipSelect<Reason>
        label={t('dispute.reason')}
        value={reason}
        onChange={setReason}
        options={[
          { value: 'level', label: t('dispute.reason.level') },
          { value: 'notMine', label: t('dispute.reason.notMine') },
          { value: 'evidence', label: t('dispute.reason.evidence') },
        ]}
      />
      <Textarea className="mt-4" label={t('dispute.comment')} value={comment} onChange={(e) => setComment(e.target.value)} />
      <p className="mt-4 t-caption font-normal text-ink-2">{t('dispute.note')}</p>
    </Sheet>
  )
}
