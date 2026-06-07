import { useEffect, useMemo, useState } from 'react'
import type { ModeInfo } from '../data/modes'
import { pickMultipleQuestions, pickRandomQuestion } from '../data/questions'
import { TimeLimitFields } from '../components/TimeLimitFields'
import { Icon, type IconName } from '../components/Icon'
import { formatDuration, uid } from '../utils/format'
import type {
  AppSettings,
  CustomMode,
  PracticeContext,
  PracticeModeId,
  RecordKind,
  TimeLimitConfig,
} from '../types'
type QuestionFlow = 'single' | 'triple' | 'quint'
type StepKey = 'mode' | 'time' | 'review' | 'record'

const MAX_CUSTOM_QUESTIONS = 20

interface Props {
  settings: AppSettings
  modes: ModeInfo[]
  stepIndex: number
  onBack: () => void
  onStepChange: (step: number) => void
  onStart: (ctx: PracticeContext) => void
  onQuickStart: (modeId: PracticeModeId) => void
  onAddMode: (mode: CustomMode) => void
  onDeleteMode: (id: string) => void
}

export function SetupPage({
  settings,
  modes,
  stepIndex,
  onBack,
  onStepChange,
  onStart,
  onQuickStart,
  onAddMode,
  onDeleteMode,
}: Props) {
  const [modeId, setModeId] = useState<PracticeModeId | null>(null)
  const [questionFlow, setQuestionFlow] = useState<QuestionFlow>('single')
  const [questions, setQuestions] = useState<string[]>([])
  const [recordKind, setRecordKind] = useState<RecordKind>(settings.defaultRecordKind)
  const [timeLimit, setTimeLimit] = useState<TimeLimitConfig>({
    ...settings.defaultTimeLimit,
    reminders: { ...settings.defaultTimeLimit.reminders },
  })
  const [hideQuestions, setHideQuestions] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newQuestionsText, setNewQuestionsText] = useState('')

  const questionCount = questionFlow === 'single' ? 1 : questionFlow === 'triple' ? 3 : 5
  const multiMode = questionCount > 1

  const steps = useMemo<StepKey[]>(() => ['mode', 'time', 'review', 'record'], [])

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)]

  useEffect(() => {
    if (multiMode && !timeLimit.enabled) {
      setTimeLimit((t) => ({ ...t, enabled: true }))
    }
  }, [multiMode, timeLimit.enabled])

  function refreshQuestions(flow: QuestionFlow, mode: PracticeModeId) {
    const count = flow === 'single' ? 1 : flow === 'triple' ? 3 : 5
    if (count > 1) {
      setQuestions(pickMultipleQuestions(mode, count))
    } else {
      setQuestions([pickRandomQuestion(mode)])
    }
  }

  function handleModeSelect(id: PracticeModeId) {
    setModeId(id)
    refreshQuestions(questionFlow, id)
  }

  function handleModeNext() {
    if (modeId) onStepChange(1)
  }

  function buildQuickDesc(): string {
    const qs = settings.quickStart
    const parts: string[] = []
    parts.push(qs.recordKind === 'video' ? '영상 + 음성' : '녹음만')
    parts.push(qs.questionCount > 1 ? `연속 ${qs.questionCount}문항` : '질문 1개')
    parts.push(qs.timeLimit.enabled ? `질문당 ${formatDuration(qs.timeLimit.limitSeconds)}` : '시간 제한 없음')
    return parts.join(' · ')
  }

  function shuffle() {
    if (modeId) refreshQuestions(questionFlow, modeId)
  }

  function handleCountChange(count: 1 | 3 | 5) {
    const flow: QuestionFlow = count === 1 ? 'single' : count === 3 ? 'triple' : 'quint'
    setQuestionFlow(flow)
    if (modeId) refreshQuestions(flow, modeId)
  }

  const canStart = !multiMode || timeLimit.enabled

  function goNext() {
    onStepChange(Math.min(stepIndex + 1, steps.length - 1))
  }

  function goPrev() {
    onBack()
  }

  const selectedMode = modes.find((m) => m.id === modeId)

  const builtinIds = new Set(['career', 'media', 'customer', 'presentation', 'english'])

  function handleAddMode() {
    const label = newLabel.trim()
    const lines = newQuestionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, MAX_CUSTOM_QUESTIONS)
    if (!label || lines.length === 0) return
    const mode: CustomMode = {
      id: `custom_${uid()}`,
      label,
      description: `질문 ${lines.length}개`,
      questions: lines,
    }
    onAddMode(mode)
    setNewLabel('')
    setNewQuestionsText('')
    setShowAddForm(false)
  }

  const stepTitles: Record<StepKey, string> = {
    mode: '면접 종류',
    time: '시간 제한',
    review: '질문 확인',
    record: '녹화 방식',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <header style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={goPrev}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: -10 }}
        >
          <Icon name="chevronLeft" size={18} />
          {stepIndex === 0 ? '홈' : '이전'}
        </button>
        <div className="step-track">
          {steps.map((s, i) => (
            <span key={s} className={i <= stepIndex ? 'done' : ''} />
          ))}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {stepIndex + 1} / {steps.length}
          {selectedMode && currentStep !== 'mode' ? ` · ${selectedMode.label}` : ''}
        </p>
        <h1 className="page-title" style={{ marginTop: 4 }}>
          {stepTitles[currentStep]}
        </h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {currentStep === 'mode' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modes.map((m) => (
                <div key={m.id} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`option-card ${modeId === m.id ? 'selected' : ''}`}
                    onClick={() => handleModeSelect(m.id)}
                  >
                    <span className="option-icon">
                      <Icon name={m.icon} size={22} />
                    </span>
                    <span style={{ flex: 1 }}>
                      <span className="option-title">{m.label}</span>
                      <span className="option-desc">{m.description}</span>
                    </span>
                  </button>
                  {!builtinIds.has(m.id) && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDeleteMode(m.id) }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        padding: 6,
                        borderRadius: 8,
                        color: 'var(--text-muted)',
                        background: 'none',
                      }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              ))}

              {!showAddForm ? (
                <button
                  type="button"
                  className="option-card"
                  onClick={() => setShowAddForm(true)}
                  style={{ borderStyle: 'dashed', justifyContent: 'center', gap: 8, color: 'var(--text-muted)' }}
                >
                  <Icon name="plus" size={20} />
                  <span className="option-title" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                    면접 종류 추가
                  </span>
                </button>
              ) : (
                <div className="glass-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>새 면접 종류</span>
                    <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowAddForm(false)}>
                      취소
                    </button>
                  </div>
                  <label className="label-sm">이름</label>
                  <input
                    className="input-field"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="예: 승진 심사, 대학원 면접"
                    maxLength={30}
                  />
                  <label className="label-sm" style={{ marginTop: 14 }}>
                    질문 (줄바꿈으로 구분, 최대 {MAX_CUSTOM_QUESTIONS}개)
                  </label>
                  <textarea
                    className="textarea-field"
                    value={newQuestionsText}
                    onChange={(e) => setNewQuestionsText(e.target.value)}
                    placeholder={'질문 1\n질문 2\n질문 3'}
                    rows={6}
                    style={{ minHeight: 120 }}
                  />
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '6px 0 12px' }}>
                    {newQuestionsText.split('\n').filter((l) => l.trim()).length} / {MAX_CUSTOM_QUESTIONS}개 입력됨
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={!newLabel.trim() || !newQuestionsText.split('\n').some((l) => l.trim())}
                    onClick={handleAddMode}
                  >
                    추가
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {currentStep === 'time' && (
          <TimeLimitFields value={timeLimit} onChange={setTimeLimit} showMultiHint={multiMode} />
        )}

        {currentStep === 'record' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <RecordCard
                active={recordKind === 'video'}
                onClick={() => setRecordKind('video')}
                icon="video"
                title="영상 + 음성"
                desc="표정·시선·자세까지 돌아보기"
              />
              <RecordCard
                active={recordKind === 'audio'}
                onClick={() => setRecordKind('audio')}
                icon="mic"
                title="녹음만"
                desc="말투·속도·내용에 집중"
              />
            </div>
            <div
              className="glass-card"
              style={{ padding: 14, marginTop: 16, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}
            >
              <div>· 질문: {questionCount > 1 ? `연속 ${questionCount}문항` : '1개'}</div>
              <div>
                · 시간: {timeLimit.enabled ? `질문당 ${formatDuration(timeLimit.limitSeconds)}` : '제한 없음'}
              </div>
              {multiMode && <div>· 시간 종료 시 다음 질문으로 자동 전환</div>}
            </div>
          </>
        )}

        {currentStep === 'review' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label className="label-sm" style={{ marginBottom: 8, display: 'block' }}>질문 개수</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([1, 3, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`chip ${questionCount === n ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleCountChange(n)}
                  >
                    {n === 1 ? '1개' : `${n}문항`}
                  </button>
                ))}
              </div>
              {multiMode && (
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>
                  질문당 시간이 끝나면 다음 질문으로 자동 전환됩니다.
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                {hideQuestions ? '질문이 가려져 있습니다' : `질문 ${questions.length}개`}
              </span>
              <button
                type="button"
                className={`chip ${hideQuestions ? 'active' : ''}`}
                onClick={() => setHideQuestions((v) => !v)}
                style={{ padding: '6px 14px' }}
              >
                {hideQuestions ? '보기' : '가리기'}
              </button>
            </div>

            {hideQuestions ? (
              <div
                className="glass-card"
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  marginBottom: 16,
                  color: 'var(--text-muted)',
                }}
              >
                <Icon name="practice" size={32} />
                <p style={{ margin: '12px 0 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  질문을 보지 않고 바로 시작할 수 있어요.<br />
                  녹화가 시작되면 질문이 표시됩니다.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {questions.map((q, i) => (
                  <div key={i} className="glass-card" style={{ padding: 14 }}>
                    {questions.length > 1 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                        Q{i + 1}
                      </span>
                    )}
                    <p style={{ margin: questions.length > 1 ? '6px 0 0' : 0, lineHeight: 1.5, fontSize: '0.95rem' }}>
                      {q}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!hideQuestions && (
              <button type="button" className="btn btn-secondary btn-block" onClick={shuffle} style={{ marginBottom: 16 }}>
                {questions.length > 1 ? '질문 세트 다시 뽑기' : '다른 질문 뽑기'}
              </button>
            )}

            <div
              className="glass-card"
              style={{ padding: 14, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}
            >
              <div>
                · 시간: {timeLimit.enabled ? `질문당 ${formatDuration(timeLimit.limitSeconds)}` : '제한 없음'}
              </div>
              {multiMode && <div>· 연속 {questionCount}문항 (시간 종료 시 다음 질문)</div>}
            </div>
          </>
        )}
      </div>

      <footer style={{ paddingTop: 16 }}>
        {currentStep === 'record' ? (
          <>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={!canStart}
              onClick={() =>
                modeId &&
                onStart({
                  modeId,
                  recordKind,
                  questions,
                  timeLimit,
                  autoNextQuestion: multiMode && timeLimit.enabled,
                })
              }
            >
              연습 시작
            </button>
            {multiMode && !timeLimit.enabled && (
              <p style={{ fontSize: '0.8rem', color: 'var(--rose)', textAlign: 'center', marginTop: 10 }}>
                연속 질문은 시간 제한을 켜 주세요.
              </p>
            )}
          </>
        ) : currentStep === 'mode' ? (
          modeId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="btn btn-block"
                onClick={() => onQuickStart(modeId)}
                style={{
                  padding: '13px 18px',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  border: '1.5px solid var(--accent)',
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'block', fontSize: '0.9rem' }}>빠른 시작</span>
                <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 500, marginTop: 3, opacity: 0.8 }}>
                  {buildQuickDesc()}
                </span>
              </button>
              <button type="button" className="btn btn-primary btn-block" onClick={handleModeNext}>
                다음 — 상세 설정
              </button>
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              종류를 선택해 주세요.
            </p>
          )
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={goNext}>
            다음
          </button>
        )}
      </footer>
    </div>
  )
}

function RecordCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: IconName
  title: string
  desc: string
}) {
  return (
    <button type="button" className={`option-card ${active ? 'selected' : ''}`} onClick={onClick}>
      <span className="option-icon">
        <Icon name={icon} size={22} />
      </span>
      <span>
        <span className="option-title">{title}</span>
        <span className="option-desc">{desc}</span>
      </span>
    </button>
  )
}
