import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'

const ToastContext = createContext<(msg: string) => void>(() => {})

/** One short confirmation at a time, above the tab bar. Announced to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null)
  const show = useCallback((text: string) => {
    const id = Date.now()
    setMsg({ id, text })
    setTimeout(() => setMsg((m) => (m?.id === id ? null : m)), 2600)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+var(--safe-bottom))] z-[60] flex justify-center px-5 lg:bottom-8" aria-live="polite">
        <AnimatePresence>
          {msg && (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex max-w-app items-center gap-2 rounded-control bg-ink px-4 py-3 t-caption text-on-ink shadow-3"
            >
              <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden />
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
