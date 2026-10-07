import type { ReactNode } from 'react'

/** Single line illustration in ink-3, one sentence, one button. */
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <svg width="96" height="72" viewBox="0 0 96 72" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="18" y="14" width="52" height="44" rx="8" />
        <path d="M28 28h32M28 37h22M28 46h14" />
        <path d="M60 50l10 10M64.5 45.5a8 8 0 1 1-11.3 11.3 8 8 0 0 1 11.3-11.3z" />
        <path d="M6 64h84" strokeDasharray="2 5" />
      </svg>
      <p className="mt-4 t-body-strong text-ink">{title}</p>
      {body && <p className="mt-1 t-body text-ink-2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
