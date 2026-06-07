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
import type { PracticeSession } from '../types'

type CareerFlow = 'single' | 'triple' | 'quint'
type StepKey = 'mode' | 'flow' | 'time' | 'record' | 'review'

const MAX_CUSTOM_QUESTIONS = 20

interface Props {
  settings: AppSettings
  modes: ModeInfo[]
  lastSummary?: PracticeSession
  onBack: () => void
  onStart: (ctx: PracticeContext) => void
  onQuickStart: (modeId: PracticeModeId) => void
  onAddMode: (mode: CustomMode) => void
  onDeleteMode: (id: string) => void
}

export function SetupPage({ settings, modes, lastSummary, onBack, onStart, onQuickStart, onAddMode, onDeleteMode }: Props) {
  const [modeId, setModeId] = useState<PracticeModeId | null>(null)
  const [careerFlow, setCareerFlow] = useState<CareerFlow>('single')
  const [questions, setQuestions] = useState<string[]>([])
  const [recordKind, setRecordKind] = useState<RecordKind>(settings.defaultRecordKind)
  const [timeLimit, setTimeLimit] = useState<TimeLimitConfig>({
    ...settings.defaultTimeLimit,
    reminders: { ...settings.defaultTimeLimit.reminders },
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [showSummary, setShowSummary] = useState(!!lastSummary?.summary.focusNext)
  const [hideQuestions, setHideQuestions] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newQuestionsText, setNewQuestionsText] = useState('')

  const isCareer = modeId === 'career'
  const questionCount = careerFlow === 'single' ? 1 : careerFlow === 'triple' ? 3 : 5
  const multiMode = questionCount > 1

  const steps = useMemo<StepKey[]>(() => {
    const base: StepKey[] = ['mode']
    if (isCareer) base.push('flow')
    base.push('time', 'record', 'review')
    return base
  }, [isCareer])

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)]

  useEffect(() => {
    if (multiMode && !timeLimit.enabled) {
      setTimeLimit((t) => ({ ...t, enabled: true }))
    }
  }, [multiMode, timeLimit.enabled])

  function refreshQuestions(flow: CareerFlow, mode: PracticeModeId) {
    const count = flow === 'single' ? 1 : flow === 'triple' ? 3 : 5
    if (count > 1) {
      setQuestions(pickMultipleQuestions(mode, count))
    } else {
      setQuestions([pickRandomQuestion(mode)])
    }
  }

  function handleModeSelect(id: PracticeModeId) {
    setModeId(id)
    setShowSummary(false)
    if (id !== 'career') {
      setCareerFlow('single')
      setQuestions([pickRandomQuestion(id)])
    } else {
      refreshQuestions('single', 'career')
      setCareerFlow('single')
    }
  }

  function handleModeNext() {
    if (modeId) setStepIndex(1)
  }

  function buildQuickDesc(): string {
    const qs = settings.quickStart
    const parts: string[] = []
    parts.push(qs.recordKind === 'video' ? '영상 + 음성' : '녹음만')
    if (modeId === 'career' && qs.questionCount > 1) {
      parts.push(`연속 ${qs.questionCount}문항`)
    } else {
      parts.push('질문 1개')
    }
    parts.push(qs.timeLimit.enabled ? `질문당 ${formatDuration(qs.timeLimit.limitSeconds)}` : '시간 제한 없음')
    return parts.join(' · ')
  }

  function handleCareerFlow(flow: CareerFlow) {
    setCareerFlow(flow)
    refreshQuestions(flow, 'career')
  }

  function shuffle() {
    refreshQuestions(careerFlow, modeId ?? 'career')
  }

  function handleCountChange(count: 1 | 3 | 5) {
    const flow: CareerFlow = count === 1 ? 'single' : count === 3 ? 'triple' : 'quint'
    setCareerFlow(flow)
    refreshQuestions(flow, modeId ?? 'career')
  }

  const canStart = !multiMode || timeLimit.enabled

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function goPrev() {
    if (stepIndex <= 0) {
      onBack()
    } else {
      setStepIndex((i) => i - 1)
    }
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
    flow: '면접 형식',
    time: '시간 제한',
    record: '녹화 방식',
    review: '질문 확인',
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
            {showSummary && lastSummary && (
              <SummaryCard summary={lastSummary.summary} onClose={() => setShowSummary(false)} />
            )}
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

        {currentStep === 'flow' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FlowCard
              active={careerFlow === 'single'}
              onClick={() => handleCareerFlow('single')}
              title="질문 1개"
              desc="한 질문에 집중해서 답변"
            />
            <FlowCard
              active={careerFlow === 'triple'}
              onClick={() => handleCareerFlow('triple')}
              title="연속 3문항"
              desc="질문당 시간이 끝나면 다음 질문으로"
            />
            <FlowCard
              active={careerFlow === 'quint'}
              onClick={() => handleCareerFlow('quint')}
              title="연속 5문항"
              desc="질문당 시간이 끝나면 다음 질문으로"
            />
          </div>
        )}

        {currentStep === 'time' && (
          <TimeLimitFields value={timeLimit} onChange={setTimeLimit} showMultiHint={multiMode} />
        )}

        {currentStep === 'record' && (
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
              <div>· 녹화: {recordKind === 'video' ? '영상 + 음성' : '녹음만'}</div>
              <div>
                · 시간: {timeLimit.enabled ? `질문당 ${formatDuration(timeLimit.limitSeconds)}` : '제한 없음'}
              </div>
              {multiMode && <div>· 연속 {questionCount}문항 (시간 종료 시 다음 질문)</div>}
            </div>
          </>
        )}
      </div>

      <footer style={{ paddingTop: 16 }}>
        {currentStep === 'review' ? (
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

function SummaryCard({
  summary,
  onClose,
}: {
  summary: PracticeSession['summary']
  onClose: () => void
}) {
  if (!summary.wellDone && !summary.improve && !summary.focusNext) return null
  return (
    <div
      className="glass-card"
      style={{
        padding: 16,
        marginBottom: 16,
        borderColor: 'var(--accent)',
        background: 'var(--accent-soft)',
      }}
    >
      <p style={{ margin: '0 0 10px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em' }}>
        지난 연습에서 남긴 말
      </p>
      {summary.focusNext && (
        <p style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: 600 }}>
          <SummaryTag label="이번 집중" color="var(--accent)" /> {summary.focusNext}
        </p>
      )}
      {summary.improve && (
        <p style={{ margin: '0 0 5px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <SummaryTag label="고칠 점" color="var(--rose)" /> {summary.improve}
        </p>
      )}
      {summary.wellDone && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <SummaryTag label="잘한 점" color="var(--teal)" /> {summary.wellDone}
        </p>
      )}
      <button type="button" className="btn btn-ghost" style={{ marginTop: 8, fontSize: '0.8rem', padding: '6px 0' }} onClick={onClose}>
        닫기
      </button>
    </div>
  )
}

function SummaryTag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.68rem',
        fontWeight: 700,
        color,
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '1px 6px',
        marginRight: 4,
      }}
    >
      {label}
    </span>
  )
}

function FlowCard({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
}) {
  return (
    <button type="button" className={`option-card ${active ? 'selected' : ''}`} onClick={onClick}>
      <span>
        <span className="option-title">{title}</span>
        <span className="option-desc">{desc}</span>
      </span>
    </button>
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
