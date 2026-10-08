import type { ReactNode } from 'react'

/** Agency page frame: title style for the page title only, optional description and actions. */
export function AgencyPage({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-title">{title}</h1>
          {description && <p className="mt-1 max-w-[70ch] t-body-sm text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
