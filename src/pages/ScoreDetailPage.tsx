import type { ItemAverage } from '../utils/stats'

interface Props {
  items: ItemAverage[]
  overall: number | null
  onBack: () => void
}

export function ScoreDetailPage({ items, overall, onBack }: Props) {
  const scaleItems = items.filter((i) => i.type === 'scale' && i.average !== null)
  const yesItems = items.filter((i) => i.type === 'yesno' && i.yesPercent !== null)

  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← 통계
        </button>
      </header>
      <h1 className="page-title">항목별 평균</h1>
      <p className="page-sub">
        {overall !== null ? `전체 평균 ${overall.toFixed(1)}점 · ` : ''}1~5 척도 및 예/아니오 응답 요약
      </p>

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

      {items.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
          아직 피드백 점수가 없습니다. 연습 후 셀프 코칭을 작성해 보세요.
        </p>
      )}
    </>
  )
}
