import type { QuestionnaireAnswer, QuestionnaireItem } from '../types'

interface Props {
  items: QuestionnaireItem[]
  answers: QuestionnaireAnswer[]
  onChange: (answers: QuestionnaireAnswer[]) => void
}

function getValue(answers: QuestionnaireAnswer[], id: string): string | number | boolean | undefined {
  return answers.find((a) => a.itemId === id)?.value
}

export function QuestionnaireForm({ items, answers, onChange }: Props) {
  const set = (itemId: string, value: string | number | boolean) => {
    const next = answers.filter((a) => a.itemId !== itemId)
    next.push({ itemId, value })
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {items.map((item) => (
        <div key={item.id} className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 12 }}>
            {item.label}
          </div>
          {item.type === 'yesno' && (
            <div className="yesno-row">
              <button
                type="button"
                className={`yesno-btn ${getValue(answers, item.id) === true ? 'selected' : ''}`}
                onClick={() => set(item.id, true)}
              >
                예
              </button>
              <button
                type="button"
                className={`yesno-btn ${getValue(answers, item.id) === false ? 'selected' : ''}`}
                onClick={() => set(item.id, false)}
              >
                아니오
              </button>
            </div>
          )}
          {item.type === 'scale' && (
            <div className="scale-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`scale-btn ${getValue(answers, item.id) === n ? 'selected' : ''}`}
                  onClick={() => set(item.id, n)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {item.type === 'text' && (
            <input
              className="input-field"
              value={(getValue(answers, item.id) as string) ?? ''}
              onChange={(e) => set(item.id, e.target.value)}
              placeholder="입력"
            />
          )}
        </div>
      ))}
    </div>
  )
}
