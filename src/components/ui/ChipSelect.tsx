import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Selectable chips (single or multi). Selected = ink fill with a check. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  multiple,
  label,
}: {
  options: { value: T; label: string }[]
  value: T[]
  onChange: (v: T[]) => void
  multiple?: boolean
  label: string
}) {
  const toggle = (v: T) => {
    if (!multiple) return onChange([v])
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.value)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-control border px-3 t-caption transition-colors',
              on ? 'border-ink bg-ink text-on-ink' : 'border-hairline bg-surface text-ink hover:bg-surface-muted',
            )}
          >
            {on && <Check size={14} strokeWidth={2} aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
