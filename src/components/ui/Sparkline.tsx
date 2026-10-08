/** Tiny trend line for KPI tiles: no axes, last point marked. The figure beside it carries the value. */
export function Sparkline({ values, label, width = 96, height = 28 }: { values: number[]; label: string; width?: number; height?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [2 + (i / (values.length - 1)) * (width - 4), 2 + (1 - (v - min) / span) * (height - 4)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block overflow-visible">
      <path d={d} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={3} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  )
}
