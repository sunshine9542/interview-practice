import { useEffect, useMemo, useState } from 'react'
import type { ModeInfo } from '../data/modes'
import { getModeFocusPoints } from '../data/questionnaires'
import { computeItemAverages, computeOverallScaleAverage } from '../utils/stats'
import type { AppSettings, PracticeModeId, PracticeSession } from '../types'

interface Props {
  sessions: PracticeSession[]
  modes: ModeInfo[]
  settings: AppSettings
  onBack: () => void
}

function hasFeedback(sessions: PracticeSession[], modeId: PracticeModeId): boolean {
  return sessions.some(
    (s) =>
      s.modeId === modeId &&
      s.questionnaireAnswers.some(
        (a) =>
          (typeof a.value === 'number' && a.value >= 1 && a.value <= 5) ||
          typeof a.value === 'boolean',
      ),
  )
}

export function ScoreDetailPage({ sessions, modes, settings, onBack }: Props) {
  const practicedModes = useMemo(
    () => modes.filter((m) => sessions.some((s) => s.modeId === m.id)),
    [modes, sessions],
  )

  const [selectedId, setSelectedId] = useState<PracticeModeId | null>(null)

  useEffect(() => {
    if (selectedId && practicedModes.some((m) => m.id === selectedId)) return
    const withScores = practicedModes.find((m) => hasFeedback(sessions, m.id))
    setSelectedId(withScores?.id ?? practicedModes[0]?.id ?? null)
  }, [practicedModes, selectedId, sessions])

  const selectedMode = practicedModes.find((m) => m.id === selectedId)
  const items = useMemo(
    () => (selectedId ? computeItemAverages(sessions, settings, selectedId) : []),
    [sessions, settings, selectedId],
  )
  const overall = useMemo(
    () => (selectedId ? computeOverallScaleAverage(sessions, selectedId) : null),
    [sessions, selectedId],
  )
  const focusPoints = selectedId ? getModeFocusPoints(selectedId) : []
  const scaleItems = items.filter((i) => i.type === 'scale' && i.average !== null)
  const yesItems = items.filter((i) => i.type === 'yesno' && i.yesPercent !== null)
  const sessionCount = selectedId ? sessions.filter((s) => s.modeId === selectedId).length : 0

  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← 통계
        </button>
      </header>
      <h1 className="page-title">면접별 점수</h1>
      <p className="page-sub">면접 종류를 선택하면 해당 유형의 체크 포인트와 점수를 볼 수 있어요.</p>

      {practicedModes.length > 0 ? (
        <div className="score-mode-chips" role="tablist" aria-label="면접 종류">
          {practicedModes.map((m) => {
            const active = m.id === selectedId
            const scored = hasFeedback(sessions, m.id)
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`chip score-mode-chip ${active ? 'active' : ''}`}
                onClick={() => setSelectedId(m.id)}
              >
                {m.label}
                {!scored && (
                  <span style={{ marginLeft: 4, fontSize: '0.65rem', opacity: 0.7 }}>· 미작성</span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
          아직 연습 기록이 없습니다.
        </p>
      )}

      {selectedMode && (
        <section className="glass-card score-mode-intro" style={{ padding: 14, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700 }}>{selectedMode.label}</h2>
          <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {selectedMode.description}
          </p>
          <p className="label-sm" style={{ marginBottom: 6 }}>이 면접에서 볼 포인트</p>
          <div className="score-focus-tags">
            {focusPoints.map((point) => (
              <span key={point} className="score-focus-tag">
                {point}
              </span>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            연습 {sessionCount}회
            {overall !== null ? ` · 평균 ${overall.toFixed(1)}점` : ''}
          </p>
        </section>
      )}

      {scaleItems.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 className="label-sm">척도 항목 (1~5)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scaleItems.map((item) => (
              <div key={item.itemId} className="glass-card score-detail-card">
                <div className="score-detail-card__head">
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {item.label}
                    {item.custom && (
                      <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--teal)', fontWeight: 700 }}>
                        내 항목
                      </span>
                    )}
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
                    {item.average!.toFixed(1)}
                  </strong>
                </div>
                <div className="score-detail-card__bar">
                  <div
                    className="score-detail-card__fill"
                    style={{ width: `${((item.average! - 1) / 4) * 100}%` }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.count}회 응답</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {yesItems.length > 0 && (
        <section>
          <h2 className="label-sm">예/아니오 항목</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {yesItems.map((item) => (
              <div key={item.itemId} className="glass-card score-detail-card">
                <div className="score-detail-card__head">
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--teal)' }}>예 {item.yesPercent}%</strong>
                </div>
                <div className="score-detail-card__bar">
                  <div
                    className="score-detail-card__fill"
                    style={{ width: `${item.yesPercent}%`, background: 'var(--teal)' }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.count}회 응답</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedId && items.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
          이 면접 종류의 피드백이 아직 없습니다.<br />
          연습 후 리뷰에서 셀프 코칭을 작성해 보세요.
        </p>
      )}
    </>
  )
}
