import { useEffect, useRef, useState, type RefObject } from 'react'
import { getQuestionnaireTemplate } from '../data/questionnaires'
import { QuestionnaireForm } from '../components/QuestionnaireForm'
import { Icon } from '../components/Icon'
import { formatDuration } from '../utils/format'
import { uid } from '../utils/format'
import type {
  PracticeSession,
  QuestionnaireAnswer,
  SessionSummary,
  TimestampMemo,
} from '../types'

interface Props {
  session: PracticeSession
  isNew?: boolean
  onSave: (session: PracticeSession) => void
  onDelete?: () => void
  onDone: (session: PracticeSession) => void
}

export function ReviewPage({ session, isNew, onSave, onDelete, onDone }: Props) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)
  const [url, setUrl] = useState('')
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>(session.questionnaireAnswers)
  const [memos, setMemos] = useState<TimestampMemo[]>(session.memos)
  const [memoText, setMemoText] = useState('')
  const [summary, setSummary] = useState<SessionSummary>(session.summary)
  const [currentTime, setCurrentTime] = useState(0)

  const items = getQuestionnaireTemplate(session.modeId)
  const isVideo = session.recordKind === 'video'

  useEffect(() => {
    const u = URL.createObjectURL(session.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [session.blob])

  const addMemoAtCurrent = () => {
    if (!memoText.trim()) return
    const m: TimestampMemo = {
      id: uid(),
      atSeconds: Math.floor(currentTime),
      text: memoText.trim(),
    }
    setMemos((prev) => [...prev, m].sort((a, b) => a.atSeconds - b.atSeconds))
    setMemoText('')
  }

  const seekTo = (sec: number) => {
    const el = mediaRef.current
    if (el) {
      el.currentTime = sec
      void el.play()
    }
  }

  const handleSave = () => {
    onSave({
      ...session,
      questionnaireAnswers: answers,
      memos,
      summary,
    })
  }

  const finish = () => {
    const updated = {
      ...session,
      questionnaireAnswers: answers,
      memos,
      summary,
    }
    handleSave()
    onDone(updated)
  }

  return (
    <div className="review-page">
      <div className="review-page__body">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            onDone({
              ...session,
              questionnaireAnswers: answers,
              memos,
              summary,
            })
          }
        >
          ← 목록
        </button>
        {onDelete && (
          <button type="button" className="btn btn-ghost" style={{ color: 'var(--rose)' }} onClick={onDelete}>
            삭제
          </button>
        )}
      </header>

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg)',
          paddingBottom: 12,
          marginBottom: 8,
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '0.82rem',
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >
          이번 질문
        </p>
        {session.questions.length > 1 ? (
          <ol style={{ margin: '0 0 12px', paddingLeft: 20, fontSize: '0.9rem', lineHeight: 1.5 }}>
            {session.questions.map((q, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {q}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ margin: '0 0 12px', fontSize: '0.95rem', lineHeight: 1.45 }}>{session.question}</p>
        )}
        {session.timeLimitEnabled && session.questionLimitSeconds && (
          <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            질문당 {formatDuration(session.questionLimitSeconds)} 제한
            {session.questions.length > 1 ? ` · ${session.questions.length}문항 연속` : ''}
          </p>
        )}

        {isVideo ? (
          <video
            ref={mediaRef as RefObject<HTMLVideoElement>}
            src={url}
            controls
            playsInline
            style={{
              width: '100%',
              borderRadius: 'var(--radius)',
              background: '#000',
              maxHeight: '42vh',
            }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
        ) : (
          <div
            className="glass-card"
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span className="option-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
              <Icon name="mic" size={24} />
            </span>
            <audio
              ref={mediaRef as RefObject<HTMLAudioElement>}
              src={url}
              controls
              style={{ width: '100%' }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {formatDuration(session.durationSeconds)}
            </span>
          </div>
        )}
        <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          재생: {formatDuration(Math.floor(currentTime))}
        </p>
      </div>

      <section style={{ marginTop: 20 }}>
        <h2 className="label-sm">메모</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="input-field"
            placeholder="이 시점에 메모..."
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
          />
          <button type="button" className="btn btn-secondary" onClick={addMemoAtCurrent} style={{ flexShrink: 0 }}>
            추가
          </button>
        </div>
        {memos.map((m) => (
          <button
            key={m.id}
            type="button"
            className="glass-card"
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 8,
              textAlign: 'left',
              border: '1px solid var(--border)',
            }}
            onClick={() => seekTo(m.atSeconds)}
          >
            <span style={{ color: 'var(--teal)', fontSize: '0.8rem', fontWeight: 600 }}>
              {formatDuration(m.atSeconds)}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{m.text}</p>
          </button>
        ))}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="label-sm">셀프 코칭 질문지</h2>
        <QuestionnaireForm items={items} answers={answers} onChange={setAnswers} />
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="label-sm">이번 연습 총평</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label-sm" style={{ textTransform: 'none', letterSpacing: 0 }}>
              잘한 점
            </label>
            <textarea
              className="textarea-field"
              value={summary.wellDone}
              onChange={(e) => setSummary((s) => ({ ...s, wellDone: e.target.value }))}
              placeholder="스스로 인정한 강점"
            />
          </div>
          <div>
            <label className="label-sm" style={{ textTransform: 'none', letterSpacing: 0 }}>
              고칠 점
            </label>
            <textarea
              className="textarea-field"
              value={summary.improve}
              onChange={(e) => setSummary((s) => ({ ...s, improve: e.target.value }))}
              placeholder="다음에 개선할 것"
            />
          </div>
          <div>
            <label className="label-sm" style={{ textTransform: 'none', letterSpacing: 0 }}>
              다음 연습 집중
            </label>
            <input
              className="input-field"
              value={summary.focusNext}
              onChange={(e) => setSummary((s) => ({ ...s, focusNext: e.target.value }))}
              placeholder="한 가지만"
            />
          </div>
        </div>
      </section>

      </div>

      <footer className="review-page__footer">
        <button type="button" className="btn btn-primary btn-block" onClick={finish}>
          {isNew ? '저장하고 완료' : '저장'}
        </button>
      </footer>
    </div>
  )
}
