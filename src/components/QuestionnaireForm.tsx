import { useState } from 'react'
import type { QuestionnaireAnswer, QuestionnaireItem } from '../types'

interface Props {
  items: QuestionnaireItem[]
  answers: QuestionnaireAnswer[]
  onChange: (answers: QuestionnaireAnswer[]) => void
  onAddItem?: (label: string, type: 'scale' | 'yesno') => void
  onRemoveItem?: (itemId: string) => void
}

function getValue(answers: QuestionnaireAnswer[], id: string): string | number | boolean | undefined {
  return answers.find((a) => a.itemId === id)?.value
}

export function QuestionnaireForm({ items, answers, onChange, onAddItem, onRemoveItem }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<'scale' | 'yesno'>('scale')

  const set = (itemId: string, value: string | number | boolean) => {
    const next = answers.filter((a) => a.itemId !== itemId)
    next.push({ itemId, value })
    onChange(next)
  }

  const handleAdd = () => {
    if (!newLabel.trim() || !onAddItem) return
    onAddItem(newLabel.trim(), newType)
    setNewLabel('')
    setShowAdd(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {items.map((item) => (
        <div key={item.id} className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              {item.label}
              {item.custom && (
                <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--teal)', fontWeight: 700 }}>
                  내 항목
                </span>
              )}
            </div>
            {item.custom && onRemoveItem && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '2px 6px', fontSize: '0.72rem', color: 'var(--rose)', flexShrink: 0 }}
                onClick={() => onRemoveItem(item.id)}
              >
                삭제
              </button>
            )}
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

      {onAddItem && (
        <div className="glass-card" style={{ padding: 14 }}>
          {!showAdd ? (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setShowAdd(true)}
              style={{ fontSize: '0.88rem' }}
            >
              + 피드백 항목 추가
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="input-field"
                placeholder="항목 이름 (예: 손짓 자제)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={`chip ${newType === 'scale' ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setNewType('scale')}
                >
                  1~5 점수
                </button>
                <button
                  type="button"
                  className={`chip ${newType === 'yesno' ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setNewType('yesno')}
                >
                  예/아니오
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>
                  추가
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
