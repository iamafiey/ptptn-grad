import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
}

/** Multi-line input on muted surface with a label above and an example hint below. */
export function Textarea({ label, hint, className, id, rows = 3, ...rest }: TextareaProps) {
  const auto = useId()
  const tid = id ?? auto
  return (
    <div className={className}>
      <label htmlFor={tid} className="mb-1.5 block t-caption text-ink-2">
        {label}
      </label>
      <textarea
        id={tid}
        rows={rows}
        aria-describedby={hint ? `${tid}-hint` : undefined}
        className={cn(
          'block w-full resize-none rounded-control border border-transparent bg-surface-muted px-4 py-3 t-body text-ink placeholder:text-ink-3',
          'focus:outline focus:outline-[1.5px] focus:outline-ink focus:outline-offset-2',
        )}
        {...rest}
      />
      {hint && (
        <p id={`${tid}-hint`} className="mt-1.5 px-1 t-caption font-normal text-ink-3">
          {hint}
        </p>
      )}
    </div>
  )
}
