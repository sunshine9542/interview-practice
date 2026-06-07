import type { SessionSummary } from '../types'

interface Props {
  summary: SessionSummary
}

function SummaryTag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.68rem',
        fontWeight: 700,
        color,
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '1px 6px',
        marginRight: 4,
      }}
    >
      {label}
    </span>
  )
}

export function LastSummaryCard({ summary }: Props) {
  if (!summary.wellDone && !summary.improve && !summary.focusNext) return null

  return (
    <section style={{ marginTop: 18 }}>
      <h2 className="label-sm" style={{ marginBottom: 10 }}>
        지난 연습에서 남긴 말
      </h2>
      <div
        className="glass-card"
        style={{
          padding: 16,
          borderColor: 'var(--accent)',
          background: 'var(--accent-soft)',
        }}
      >
        {summary.focusNext && (
          <p style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: 600 }}>
            <SummaryTag label="이번 집중" color="var(--accent)" /> {summary.focusNext}
          </p>
        )}
        {summary.improve && (
          <p style={{ margin: '0 0 5px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <SummaryTag label="고칠 점" color="var(--rose)" /> {summary.improve}
          </p>
        )}
        {summary.wellDone && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <SummaryTag label="잘한 점" color="var(--teal)" /> {summary.wellDone}
          </p>
        )}
      </div>
    </section>
  )
}
