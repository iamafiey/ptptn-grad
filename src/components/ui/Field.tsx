import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string
  hint?: ReactNode
  error?: string
  prefix?: string
}

/** 52px input on muted surface, radius 6, floating label, ink focus ring with 2px offset. */
export function Field({ label, hint, error, prefix, className, id, ...rest }: FieldProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      <div
        className={cn(
          'relative flex h-[52px] items-end rounded-input bg-surface-muted px-4 pb-2 border border-transparent',
          'focus-within:outline focus-within:outline-[1.5px] focus-within:outline-ink focus-within:outline-offset-2',
          error && 'border-attention',
        )}
      >
        {prefix && <span className="mr-1 t-body text-ink-2 tabular">{prefix}</span>}
        <input
          id={fid}
          placeholder=" "
          aria-invalid={!!error || undefined}
          aria-describedby={hint || error ? `${fid}-help` : undefined}
          className="peer w-full bg-transparent t-body text-ink outline-none tabular"
          {...rest}
        />
        <label
          htmlFor={fid}
          className={cn(
            'pointer-events-none absolute left-4 top-1.5 t-micro text-ink-2 transition-all duration-200 ease-app',
            'peer-placeholder-shown:top-[15px] peer-placeholder-shown:t-body peer-placeholder-shown:text-ink-3',
            'peer-focus:top-1.5 peer-focus:t-micro peer-focus:text-ink-2',
          )}
        >
          {label}
        </label>
      </div>
      {(hint || error) && (
        <p id={`${fid}-help`} className={cn('mt-1.5 px-1 t-caption', error ? 'text-attention-ink' : 'text-ink-3')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <label htmlFor={id} className="block t-body-strong text-ink">
          {label}
        </label>
        {description && <span className="block t-caption text-ink-2">{description}</span>}
      </span>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-[31px] w-[51px] shrink-0 rounded-control transition-colors duration-200', checked ? 'bg-ink' : 'bg-ink-3/40')}
      >
        <span
          className={cn(
            'absolute left-0 top-[2px] h-[27px] w-[27px] rounded-chip bg-surface shadow-1 transition-transform duration-200 ease-app',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    </div>
  )
}
