import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { SHEET_SPRING } from '@/lib/motion'
import { IconButton } from './Button'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: ReactNode
  /** Sticky footer, usually the single primary action. */
  footer?: ReactNode
}

/**
 * Bottom sheet for secondary actions. Spring 380/34, drag the handle to dismiss,
 * Esc closes, focus moves into the sheet and returns on close. Glass header only.
 */
export function Sheet({ open, onClose, title, closeLabel, children, footer }: SheetProps) {
  const reduce = useReducedMotion()
  const drag = useDragControls()
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => panel.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      returnFocus.current?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="absolute bottom-0 flex max-h-[92dvh] w-full max-w-app flex-col overflow-hidden rounded-t-hero bg-surface shadow-3 outline-none"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={reduce ? { duration: 0.2 } : SHEET_SPRING}
            drag={reduce ? false : 'y'}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="glass !rounded-none !border-x-0 !border-t-0 !shadow-none touch-none" onPointerDown={(e) => drag.start(e)}>
              <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-ink-3/50" aria-hidden />
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-2">
                <h2 id={titleId} className="t-heading text-ink">
                  {title}
                </h2>
                <IconButton label={closeLabel} onClick={onClose} size={36} className="bg-surface-muted">
                  <X size={18} strokeWidth={1.5} />
                </IconButton>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4">{children}</div>
            {footer && <div className="border-t border-hairline px-5 pt-3 pb-[calc(12px+var(--safe-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
