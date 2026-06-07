import { formatDate, formatDuration } from '../utils/format'
import { Icon } from './Icon'
import type { ModeInfo } from '../data/modes'
import type { PracticeSession } from '../types'

interface Props {
  sessions: PracticeSession[]
  modes: ModeInfo[]
  onOpen: (id: string) => void
}

export function SessionList({ sessions, modes, onOpen }: Props) {
  if (sessions.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
        연습 기록이 없습니다.
      </p>
    )
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sessions.map((s) => {
        const mode = modes.find((m) => m.id === s.modeId)
        return (
          <li key={s.id}>
            <button
              type="button"
              className="glass-card"
              style={{ width: '100%', padding: 14, textAlign: 'left', display: 'flex', gap: 13, alignItems: 'center' }}
              onClick={() => onOpen(s.id)}
            >
              <span className="option-icon" style={{ width: 40, height: 40 }}>
                {mode && <Icon name={mode.icon} size={20} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{mode?.label}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatDate(s.createdAt)}
                  </span>
                </span>
                <span
                  style={{
                    display: 'block',
                    margin: '5px 0 0',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.questions.length > 1 ? `연속 ${s.questions.length}문항 · ${s.question}` : s.question}
                </span>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--teal)', marginTop: 3, fontWeight: 600 }}>
                  {s.recordKind === 'video' ? '영상' : '음성'} · {formatDuration(s.durationSeconds)}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
