import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { getCustomFeedbackItems, getQuestionnaireTemplate } from '../data/questionnaires'
import { QuestionnaireForm } from '../components/QuestionnaireForm'
import { Icon } from '../components/Icon'
import { formatDuration, uid } from '../utils/format'
import type {
  AppSettings,
  PracticeModeId,
  PracticeSession,
  QuestionnaireAnswer,
  QuestionnaireItem,
  SessionSummary,
  TimestampMemo,
} from '../types'

interface Props {
  session: PracticeSession
  isNew?: boolean
  settings: AppSettings
  onSave: (session: PracticeSession) => void
  onAddFeedbackItem: (modeId: PracticeModeId, item: QuestionnaireItem) => void
  onRemoveFeedbackItem: (modeId: PracticeModeId, itemId: string) => void
  onDelete?: () => void
  onDone: (session: PracticeSession) => void
}

export function ReviewPage({
  session,
  isNew,
  settings,
  onSave,
  onAddFeedbackItem,
  onRemoveFeedbackItem,
  onDelete,
  onDone,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)
  const [url, setUrl] = useState('')
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>(session.questionnaireAnswers)
  const [memos, setMemos] = useState<TimestampMemo[]>(session.memos)
  const [memoText, setMemoText] = useState('')
  const [summary, setSummary] = useState<SessionSummary>(session.summary)
  const [currentTime, setCurrentTime] = useState(0)
  const [mediaCompact, setMediaCompact] = useState(false)

  const items = useMemo(
    () => getQuestionnaireTemplate(session.modeId, getCustomFeedbackItems(settings, session.modeId)),
    [session.modeId, settings],
  )
  const isVideo = session.recordKind === 'video'

  const handleAddFeedbackItem = (label: string, type: 'scale' | 'yesno') => {
    const item: QuestionnaireItem = { id: uid(), label, type, custom: true }
    onAddFeedbackItem(session.modeId, item)
  }

  useEffect(() => {
    const u = URL.createObjectURL(session.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [session.blob])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setMediaCompact(el.scrollTop > 40)
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

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
    <div className="review-page" ref={scrollRef}>
      <div className="review-page__body">
        <header className="review-page__header">
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

        <div className={`review-media-sticky${mediaCompact ? ' review-media-sticky--compact' : ''}`}>
          {isVideo ? (
            <video
              ref={mediaRef as RefObject<HTMLVideoElement>}
              className="review-media-sticky__video"
              src={url}
              controls
              playsInline
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          ) : (
            <div className="review-media-sticky__audio glass-card">
              <span className="option-icon" style={{ width: 44, height: 44, borderRadius: 14 }}>
                <Icon name="mic" size={22} />
              </span>
              <audio
                ref={mediaRef as RefObject<HTMLAudioElement>}
                src={url}
                controls
                style={{ width: '100%' }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {formatDuration(session.durationSeconds)}
              </span>
            </div>
          )}
          <p className="review-media-sticky__time">
            재생: {formatDuration(Math.floor(currentTime))}
          </p>
        </div>

        <section className="review-questions">
          <p className="review-questions__label">이번 질문</p>
          {session.questions.length > 1 ? (
            <ol className="review-questions__list">
              {session.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          ) : (
            <p className="review-questions__single">{session.question}</p>
          )}
          {session.timeLimitEnabled && session.questionLimitSeconds && (
            <p className="review-questions__meta">
              질문당 {formatDuration(session.questionLimitSeconds)} 제한
              {session.questions.length > 1 ? ` · ${session.questions.length}문항 연속` : ''}
            </p>
          )}
        </section>

        {!mediaCompact && (
          <div className="review-scroll-hint" aria-hidden>
            <div className="review-scroll-hint__peek">
              <h2 className="label-sm" style={{ margin: 0 }}>
                메모
              </h2>
              <p>아래로 스크롤하여 메모·셀프 코칭을 작성하세요</p>
            </div>
            <span className="review-scroll-hint__arrow">↓</span>
          </div>
        )}

        <section className="review-section">
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

      <section className="review-section">
        <h2 className="label-sm">셀프 코칭 질문지</h2>
        <QuestionnaireForm
          items={items}
          answers={answers}
          onChange={setAnswers}
          onAddItem={handleAddFeedbackItem}
          onRemoveItem={(id) => onRemoveFeedbackItem(session.modeId, id)}
        />
      </section>

      <section className="review-section">
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
