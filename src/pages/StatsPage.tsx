import type { ModeInfo } from '../data/modes'
import { Icon } from '../components/Icon'
import type { PracticeSession } from '../types'

interface Props {
  sessions: PracticeSession[]
  modes: ModeInfo[]
}

export function StatsPage({ sessions, modes }: Props) {
  const weekAgo = Date.now() - 7 * 86400000
  const weekCount = sessions.filter((s) => s.createdAt >= weekAgo).length

  const scaleScores: number[] = []
  sessions.forEach((s) => {
    s.questionnaireAnswers.forEach((a) => {
      if (typeof a.value === 'number' && a.value >= 1 && a.value <= 5) {
        scaleScores.push(a.value)
      }
    })
  })
  const avgScale =
    scaleScores.length > 0
      ? (scaleScores.reduce((a, b) => a + b, 0) / scaleScores.length).toFixed(1)
      : '—'

  const improveTexts = sessions
    .map((s) => s.summary.improve.trim())
    .filter(Boolean)
  const focusTexts = sessions
    .map((s) => s.summary.focusNext.trim())
    .filter(Boolean)

  const byMode = modes.map((m) => ({
    mode: m,
    count: sessions.filter((s) => s.modeId === m.id).length,
  })).filter((x) => x.count > 0)

  const videoCount = sessions.filter((s) => s.recordKind === 'video').length
  const audioCount = sessions.filter((s) => s.recordKind === 'audio').length

  return (
    <>
      <h1 className="page-title">통계</h1>
      <p className="page-sub">로컬에 저장된 연습 기록 요약입니다.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="전체 연습" value={String(sessions.length)} />
        <StatCard label="최근 7일" value={String(weekCount)} />
        <StatCard label="평균 자기점수" value={avgScale} sub="1~5 척도" />
        <StatCard label="총평 작성" value={String(improveTexts.length)} sub="고칠 점 있음" />
      </div>

      {(videoCount > 0 || audioCount > 0) && (
        <>
          <h2 className="label-sm">녹화 방식</h2>
          <div className="glass-card" style={{ padding: 16, marginBottom: 24 }}>
            <Bar label="영상" count={videoCount} total={sessions.length} color="var(--accent)" />
            <Bar label="음성만" count={audioCount} total={sessions.length} color="var(--teal)" />
          </div>
        </>
      )}

      {byMode.length > 0 && (
        <>
          <h2 className="label-sm">모드별</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {byMode.map(({ mode, count }) => (
              <div
                key={mode.id}
                className="glass-card"
                style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span className="option-icon" style={{ width: 34, height: 34, borderRadius: 10 }}>
                    <Icon name={mode.icon} size={18} />
                  </span>
                  {mode.label}
                </span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </>
      )}

      {improveTexts.length > 0 && (
        <>
          <h2 className="label-sm">최근 고칠 점</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {improveTexts.slice(0, 5).map((t, i) => (
              <li
                key={i}
                className="glass-card"
                style={{
                  padding: 12,
                  marginBottom: 8,
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  borderLeft: '3px solid var(--rose)',
                }}
              >
                {t}
              </li>
            ))}
          </ul>
        </>
      )}

      {focusTexts.length > 0 && (
        <>
          <h2 className="label-sm" style={{ marginTop: 20 }}>
            다음 집중 키워드
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {focusTexts.slice(0, 5).map((t, i) => (
              <li
                key={i}
                className="glass-card"
                style={{
                  padding: 12,
                  marginBottom: 8,
                  fontSize: '0.88rem',
                  borderLeft: '3px solid var(--teal)',
                }}
              >
                {t}
              </li>
            ))}
          </ul>
        </>
      )}

      {sessions.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
          연습을 시작하면 통계가 쌓입니다.
        </p>
      )}
    </>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Bar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total ? (count / total) * 100 : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}
