import type { ModeInfo } from '../data/modes'
import { Icon } from '../components/Icon'
import { SimpleBarChart } from '../components/SimpleBarChart'
import { SimpleLineChart } from '../components/SimpleLineChart'
import { computeDailyScoreTrend, computeOverallScaleAverage } from '../utils/stats'
import type { PracticeSession } from '../types'

interface Props {
  sessions: PracticeSession[]
  modes: ModeInfo[]
  onOpenScores: () => void
}

export function StatsPage({ sessions, modes, onOpenScores }: Props) {
  const overall = computeOverallScaleAverage(sessions)
  const avgScale = overall !== null ? overall.toFixed(1) : '—'

  const improveTexts = sessions.map((s) => s.summary.improve.trim()).filter(Boolean)
  const focusTexts = sessions.map((s) => s.summary.focusNext.trim()).filter(Boolean)

  const byMode = modes
    .map((m) => ({
      mode: m,
      count: sessions.filter((s) => s.modeId === m.id).length,
    }))
    .filter((x) => x.count > 0)

  const videoCount = sessions.filter((s) => s.recordKind === 'video').length
  const audioCount = sessions.filter((s) => s.recordKind === 'audio').length

  const dailyScores = computeDailyScoreTrend(sessions)

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
        <StatCard label="면접 종류" value={String(byMode.length)} sub="연습한 유형 수" />
        <button
          type="button"
          className="stat-card-btn"
          onClick={onOpenScores}
          disabled={sessions.length === 0}
        >
          <StatCard label="평균 자기점수" value={avgScale} sub="1~5 척도 · 탭하여 면접별" clickable />
        </button>
        <StatCard label="총평 작성" value={String(improveTexts.length)} sub="고칠 점 있음" />
      </div>

      {dailyScores.length > 0 && (
        <>
          <h2 className="label-sm">일별 평균 점수</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
            날짜별 1~5 척도 평균으로 성장 추이를 확인하세요.
          </p>
          <div className="glass-card" style={{ padding: 16, marginBottom: 24 }}>
            <SimpleLineChart points={dailyScores.map((d) => ({ label: d.label, value: d.average }))} />
          </div>
        </>
      )}

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
          <div className="glass-card" style={{ padding: 16, marginBottom: 24 }}>
            <SimpleBarChart
              items={byMode.map(({ mode, count }) => ({ label: mode.label, value: count }))}
              color="var(--teal)"
            />
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

function StatCard({
  label,
  value,
  sub,
  clickable,
}: {
  label: string
  value: string
  sub?: string
  clickable?: boolean
}) {
  return (
    <div className={`glass-card${clickable ? ' stat-card--clickable' : ''}`} style={{ padding: 16, textAlign: 'left' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      {clickable && (
        <span style={{ display: 'inline-flex', marginTop: 8, fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, alignItems: 'center', gap: 4 }}>
          면접별 보기 <Icon name="arrowRight" size={12} />
        </span>
      )}
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
