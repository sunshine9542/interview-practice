interface Point {
  label: string
  value: number
}

interface Props {
  points: Point[]
  min?: number
  max?: number
}

export function SimpleLineChart({ points, min = 1, max = 5 }: Props) {
  if (points.length === 0) return null

  const w = 280
  const h = 100
  const padX = 8
  const padY = 12
  const innerW = w - padX * 2
  const innerH = h - padY * 2

  const coords = points.map((p, i) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
    const y = padY + innerH - ((p.value - min) / (max - min)) * innerH
    return { x, y, ...p }
  })

  const line = coords.map((c) => `${c.x},${c.y}`).join(' ')

  return (
    <div className="simple-line-chart">
      <svg viewBox={`0 0 ${w} ${h}`} className="simple-line-chart__svg" aria-hidden>
        <polyline points={line} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="4" fill="var(--teal)" />
        ))}
      </svg>
      <div className="simple-line-chart__labels">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}
