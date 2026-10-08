import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'

/** Right-hand case panel: opens over the queue without leaving it (docs §Queue item anatomy). */
export function SidePanel({ open, onClose, title, subtitle, closeLabel, children, footer, width = 560 }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; closeLabel: string; children: ReactNode; footer?: ReactNode; width?: number }) {
  const reduce = useReducedMotion()
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const ret = document.activeElement as HTMLElement
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => panel.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      ret?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-ink/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            style={{ maxWidth: width }}
            className="absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-3 outline-none"
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 380, damping: 34 }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="t-heading">
                  {title}
                </h2>
                {subtitle && <div className="mt-0.5 t-body-sm text-ink-2">{subtitle}</div>}
              </div>
              <IconButton label={closeLabel} onClick={onClose} size={36} className="bg-surface-muted">
                <X size={18} strokeWidth={1.5} />
              </IconButton>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 t-body-sm">{children}</div>
            {footer && <footer className="border-t border-hairline px-6 py-4">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
