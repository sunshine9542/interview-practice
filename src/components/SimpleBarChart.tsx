interface BarItem {
  label: string
  value: number
}

interface Props {
  items: BarItem[]
  maxValue?: number
  color?: string
  unit?: string
}

export function SimpleBarChart({ items, maxValue, color = 'var(--accent)', unit = '' }: Props) {
  const max = maxValue ?? Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="simple-bar-chart">
      {items.map((item) => {
        const pct = (item.value / max) * 100
        return (
          <div key={item.label} className="simple-bar-chart__row">
            <span className="simple-bar-chart__label">{item.label}</span>
            <div className="simple-bar-chart__track">
              <div className="simple-bar-chart__fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="simple-bar-chart__value">
              {item.value}
              {unit}
            </span>
          </div>
        )
      })}
    </div>
  )
}
