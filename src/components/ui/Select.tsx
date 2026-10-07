import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string
  hideLabel?: boolean
  options: { value: string; label: string }[]
  size?: 'md' | 'sm'
}

/** Native select (keyboard + screen-reader friendly) styled with tokens. */
export function Select({ label, hideLabel, options, size = 'md', className, id, ...rest }: SelectProps) {
  const auto = useId()
  const sid = id ?? auto
  return (
    <div className={className}>
      <label htmlFor={sid} className={cn('mb-1 block t-caption text-ink-2', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <select
          id={sid}
          className={cn(
            'w-full appearance-none rounded-control border border-hairline bg-surface pr-9 text-ink',
            size === 'md' ? 'h-12 pl-4 t-body' : 'h-9 pl-3 t-caption',
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden />
      </div>
    </div>
  )
}
