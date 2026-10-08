import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useT } from '@/i18n'

/** Reason-required confirmation for rejects, returns and flags. Every reason goes to the audit log. */
export function ReasonDialog({ open, title, confirmLabel, presets = [], onCancel, onConfirm }: { open: boolean; title: string; confirmLabel: string; presets?: string[]; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const { t } = useT()
  const [reason, setReason] = useState('')
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/30 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby={id} className="w-full max-w-md rounded-card bg-surface p-6 shadow-3">
        <h2 id={id} className="t-heading">
          {title}
        </h2>
        <p className="mt-1 t-body-sm text-ink-2">{t('ag.reasonHint')}</p>
        {presets.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p} type="button" onClick={() => setReason(p)} className="rounded-control border border-hairline px-3 py-1.5 t-caption hover:bg-surface-muted">
                {p}
              </button>
            ))}
          </div>
        )}
        <Textarea className="mt-4" label={t('ag.reasonLabel')} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {t('action.cancel')}
          </Button>
          <Button
            size="sm"
            disabled={reason.trim().length < 3}
            onClick={() => {
              onConfirm(reason.trim())
              setReason('')
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
