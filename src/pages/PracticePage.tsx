import { useCallback, useEffect, useRef, useState } from 'react'
import { playCue, unlockAudio } from '../utils/sound'
import { Icon } from '../components/Icon'
import { flashDurationForQuestion, formatDuration, nextQuestionBannerDuration } from '../utils/format'
import type { AppSettings, PracticeContext, RecordKind, ReminderKind } from '../types'

type Phase = 'preview' | 'flash' | 'countdown' | 'recording'

interface ReminderToast {
  label: string
  message: string
  timeLabel: string
}

interface Props {
  settings: AppSettings
  context: PracticeContext
  focusKeyword?: string
  onCancel: () => void
  onComplete: (blob: Blob, mimeType: string, durationSeconds: number) => void
}

export function PracticePage({ settings, context, focusKeyword, onCancel, onComplete }: Props) {
  const { questions, recordKind, timeLimit, autoNextQuestion } = context
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordStartRef = useRef<number>(0)
  const questionStartRef = useRef<number>(0)
  const firedRef = useRef<Set<ReminderKind | 'end'>>(new Set())
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const questionIndexRef = useRef(0)
  const totalQuestionsRef = useRef(questions.length)
  const autoNextQuestionRef = useRef(autoNextQuestion)
  const checkTimeRemindersRef = useRef<(qElapsed: number) => void>(() => {})

  const [phase, setPhase] = useState<Phase>('preview')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [countdown, setCountdown] = useState(settings.countdownSeconds)
  const [elapsed, setElapsed] = useState(0)
  const [questionElapsed, setQuestionElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [mediaReady, setMediaReady] = useState(false)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [reminderToast, setReminderToast] = useState<ReminderToast | null>(null)
  const [questionBanner, setQuestionBanner] = useState<string | null>(null)

  const currentQuestion = questions[questionIndex] ?? questions[0]
  const totalQuestions = questions.length
  const limitEnabled = timeLimit.enabled
  const limitSec = timeLimit.limitSeconds
  const remaining = limitEnabled ? Math.max(0, limitSec - questionElapsed) : null

  const showToast = useCallback((toast: ReminderToast, playSound = true) => {
    if (playSound) playCue('click')
    setReminderToast(toast)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setReminderToast(null), 3500)
  }, [])

  const showNextQuestionBanner = useCallback((text: string) => {
    playCue(settings.soundType)
    setQuestionBanner(text)
    setTimeout(
      () => setQuestionBanner(null),
      nextQuestionBannerDuration(text, settings.questionFlashSeconds) * 1000,
    )
  }, [settings.soundType, settings.questionFlashSeconds])

  useEffect(() => {
    questionIndexRef.current = questionIndex
  }, [questionIndex])

  useEffect(() => {
    totalQuestionsRef.current = questions.length
  }, [questions.length])

  useEffect(() => {
    autoNextQuestionRef.current = autoNextQuestion
  }, [autoNextQuestion])

  const advanceQuestion = useCallback(() => {
    const next = questionIndexRef.current + 1
    if (next >= totalQuestionsRef.current) return false
    questionIndexRef.current = next
    setQuestionIndex(next)
    questionStartRef.current = Date.now()
    setQuestionElapsed(0)
    firedRef.current.clear()
    showNextQuestionBanner(questions[next])
    return true
  }, [questions, showNextQuestionBanner])

  const handleQuestionTimeEnd = useCallback(() => {
    const idx = questionIndexRef.current
    const total = totalQuestionsRef.current
    if (autoNextQuestionRef.current && idx < total - 1) {
      if (advanceQuestion()) {
        showToast({
          label: '다음 질문',
          message: '다음 질문이 표시됩니다. 계속 답변해 주세요.',
          timeLabel: formatDuration(limitSec),
        })
      }
    } else if (total > 1 && idx >= total - 1) {
      showToast({
        label: '시간 종료',
        message: '모든 질문 시간이 끝났습니다. 마무리 후 녹화 종료를 눌러 주세요.',
        timeLabel: '0:00',
      })
      playCue('ding')
    } else {
      showToast({
        label: '시간 종료',
        message: '질문 시간이 끝났습니다. 마무리하거나 녹화 종료를 눌러 주세요.',
        timeLabel: '0:00',
      })
      playCue('ding')
    }
  }, [advanceQuestion, showToast, limitSec])

  const checkTimeReminders = useCallback(
    (qElapsed: number) => {
      if (!limitEnabled) return
      const { reminders } = timeLimit
      const rem = limitSec - qElapsed
      const halfPoint = Math.floor(limitSec / 2)

      if (qElapsed >= halfPoint && !firedRef.current.has('halfway')) {
        firedRef.current.add('halfway')
        showToast({
          label: '절반',
          message: reminders.halfway,
          timeLabel: `${formatDuration(qElapsed)} / ${formatDuration(limitSec)}`,
        })
      }
      if (rem <= 30 && rem > 0 && !firedRef.current.has('thirtySec')) {
        firedRef.current.add('thirtySec')
        showToast({
          label: '30초 전',
          message: reminders.thirtySec,
          timeLabel: `${formatDuration(rem)} 남음`,
        })
      }
      if (rem <= 5 && rem > 0 && !firedRef.current.has('fiveSec')) {
        firedRef.current.add('fiveSec')
        showToast({
          label: '5초 전',
          message: reminders.fiveSec,
          timeLabel: `${formatDuration(rem)} 남음`,
        })
      }
      if (qElapsed >= limitSec && !firedRef.current.has('end')) {
        firedRef.current.add('end')
        handleQuestionTimeEnd()
      }
    },
    [limitEnabled, timeLimit, limitSec, showToast, handleQuestionTimeEnd],
  )

  checkTimeRemindersRef.current = checkTimeReminders

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const requestMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unsupported')
      return
    }
    setError(null)
    setRequesting(true)
    try {
      const constraints: MediaStreamConstraints =
        recordKind === 'video'
          ? { video: { facingMode: 'user' }, audio: true }
          : { audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setPreviewStream(stream)
      if (videoRef.current && recordKind === 'video') {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setMediaReady(true)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('permission')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('notfound')
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('inuse')
      } else {
        setError('unknown')
      }
    } finally {
      setRequesting(false)
    }
  }, [recordKind])

  // 권한이 이미 허용된 사용자는 바로 카메라를 켜고, 아니면 앱 내 안내 박스를 띄움
  useEffect(() => {
    let cancelled = false
    async function maybeAuto() {
      try {
        const name = recordKind === 'video' ? 'camera' : 'microphone'
        const status = await navigator.permissions?.query({
          name: name as PermissionName,
        })
        if (!cancelled && status?.state === 'granted') {
          void requestMedia()
        }
      } catch {
        /* Permissions API 미지원 시 버튼 클릭을 기다림 */
      }
    }
    void maybeAuto()
    return () => {
      cancelled = true
    }
  }, [recordKind, requestMedia])

  useEffect(() => stopStream, [stopStream])

  const startRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    const mime = pickMime(recordKind)
    chunksRef.current = []
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    recorderRef.current = rec
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    rec.onstop = () => {
      const type = rec.mimeType || (recordKind === 'video' ? 'video/webm' : 'audio/webm')
      const blob = new Blob(chunksRef.current, { type })
      const dur = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000))
      stopStream()
      onComplete(blob, type, dur)
    }
    rec.start(200)
    const now = Date.now()
    recordStartRef.current = now
    questionStartRef.current = now
    firedRef.current.clear()
    setPhase('recording')
    setElapsed(0)
    setQuestionElapsed(0)
    timerRef.current = setInterval(() => {
      const total = Math.floor((Date.now() - recordStartRef.current) / 1000)
      const qEl = Math.floor((Date.now() - questionStartRef.current) / 1000)
      setElapsed(total)
      setQuestionElapsed(qEl)
      checkTimeRemindersRef.current(qEl)
    }, 250)
  }, [recordKind, onComplete, stopStream])

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }, [])

  const runCountdown = useCallback(async () => {
    setPhase('countdown')
    let left = settings.countdownSeconds
    setCountdown(left)
    playCue('click')

    while (left > 0) {
      await delay(1000)
      left -= 1
      if (left > 0) {
        setCountdown(left)
        playCue('click')
      }
    }
  }, [settings.countdownSeconds])

  const runSequence = useCallback(async () => {
    unlockAudio()
    playCue(settings.soundType)

    setPhase('flash')
    const holdMs = flashDurationForQuestion(currentQuestion, settings.questionFlashSeconds) * 1000
    await delay(holdMs)

    await runCountdown()
    startRecording()
  }, [settings, currentQuestion, runCountdown, startRecording])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const progressPct = limitEnabled ? Math.min(100, (questionElapsed / limitSec) * 100) : 0

  const permissionOverlay = !mediaReady ? (
    <PermissionGate
      recordKind={recordKind}
      error={error}
      requesting={requesting}
      onRequest={() => void requestMedia()}
      onCancel={onCancel}
    />
  ) : null

  return (
    <div className="app-shell" style={{ padding: '20px 20px 16px' }}>
      {permissionOverlay}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          취소
        </button>
        <div style={{ textAlign: 'right' }}>
          {phase === 'recording' && (
            <>
              {totalQuestions > 1 && (
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                  질문 {questionIndex + 1}/{totalQuestions}
                </p>
              )}
              {limitEnabled && remaining !== null && (
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--teal)', fontWeight: 600 }}>
                  남은 {formatDuration(remaining)}
                </p>
              )}
            </>
          )}
        </div>
      </header>

      <div
        className={`media-stage${phase === 'recording' ? ' media-stage--recording' : ''}`}
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          aspectRatio:
            recordKind === 'video'
              ? settings.layoutMode === 'landscape'
                ? '16/9'
                : '3/4'
              : 'auto',
          minHeight: recordKind === 'audio' ? 220 : undefined,
          background: 'var(--media-bg)',
          border: '1px solid var(--border)',
        }}
      >
        {recordKind === 'video' ? (
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <AudioVisualizer stream={previewStream} active={phase === 'recording'} />
        )}

        {phase === 'recording' && (
          <div className="recording-indicator" aria-live="polite">
            <span className="recording-indicator__dot" />
            <span>{recordKind === 'video' ? '녹화 중' : '녹음 중'}</span>
            <span className="recording-indicator__time">{formatDuration(elapsed)}</span>
          </div>
        )}

        {questionBanner && phase === 'recording' && (
          <div className="inline-question-banner">
            <QuestionDisplay
              question={questionBanner}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              kicker="NEXT QUESTION"
              stable
            />
          </div>
        )}

        {recordKind === 'video' && phase === 'flash' && (
          <div className="flash-overlay flash-overlay--media">
            <QuestionDisplay
              question={currentQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
            />
          </div>
        )}

        {recordKind === 'video' && phase === 'countdown' && (
          <div className="flash-overlay flash-overlay--media flash-overlay--phase">
            <QuestionDisplay
              question={currentQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              stable
            />
            <CountdownRing countdown={countdown} total={settings.countdownSeconds} />
          </div>
        )}

        {recordKind === 'video' && phase === 'preview' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: 24,
              background: 'var(--preview-gradient)',
            }}
          >
            <PreviewStartPanel
              recordKind={recordKind}
              totalQuestions={totalQuestions}
              limitEnabled={limitEnabled}
              limitSec={limitSec}
              mediaReady={mediaReady}
              focusKeyword={focusKeyword}
              onStart={() => void runSequence()}
            />
          </div>
        )}
      </div>

      {recordKind === 'audio' && phase === 'preview' && (
        <div style={{ marginTop: 16 }}>
          {focusKeyword && (
            <div className="focus-keyword-banner" style={{ marginBottom: 14 }}>
              <p className="focus-keyword-banner__label">이번 집중 키워드</p>
              <p className="focus-keyword-banner__text">{focusKeyword}</p>
            </div>
          )}
          <PreviewStartPanel
            recordKind={recordKind}
            totalQuestions={totalQuestions}
            limitEnabled={limitEnabled}
            limitSec={limitSec}
            mediaReady={mediaReady}
            onStart={() => void runSequence()}
          />
        </div>
      )}

      {recordKind === 'audio' && (phase === 'flash' || phase === 'countdown') && (
        <div className="audio-phase-panel">
          <QuestionDisplay
            question={currentQuestion}
            questionIndex={questionIndex}
            totalQuestions={totalQuestions}
            stable={phase !== 'flash'}
          />
          {phase === 'countdown' && (
            <CountdownRing countdown={countdown} total={settings.countdownSeconds} />
          )}
        </div>
      )}

      {phase === 'recording' && limitEnabled && (
        <div className="question-progress">
          <div className="question-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {phase === 'recording' && (
        <button
          type="button"
          className="btn btn-danger btn-block"
          style={{ marginTop: 16 }}
          onClick={stopRecording}
        >
          {recordKind === 'video' ? '녹화' : '녹음'} 종료
        </button>
      )}

      {reminderToast && phase === 'recording' && (
        <div className="reminder-toast" role="status">
          <p className="reminder-toast__label">{reminderToast.label}</p>
          <p className="reminder-toast__text">{reminderToast.message}</p>
          <p className="reminder-toast__time">{reminderToast.timeLabel}</p>
        </div>
      )}
    </div>
  )
}

function CountdownRing({ countdown, total }: { countdown: number; total: number }) {
  return (
    <div className="countdown-ring">
      <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="4"
          strokeDasharray={339.292}
          strokeDashoffset={339.292 * (1 - countdown / total)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s' }}
        />
      </svg>
      <span className="countdown-num">{countdown}</span>
    </div>
  )
}

function QuestionDisplay({
  question,
  questionIndex,
  totalQuestions,
  kicker = 'QUESTION',
  stable = false,
}: {
  question: string
  questionIndex: number
  totalQuestions: number
  kicker?: string
  stable?: boolean
}) {
  return (
    <>
      {totalQuestions > 1 && (
        <p className="phase-question-meta">
          질문 {questionIndex + 1} / {totalQuestions}
        </p>
      )}
      <p className="flash-kicker">{kicker}</p>
      <p className={`flash-question${stable ? ' flash-question--stable' : ''}`}>{question}</p>
    </>
  )
}

function PermissionGate({
  recordKind,
  error,
  requesting,
  onRequest,
  onCancel,
}: {
  recordKind: RecordKind
  error: string | null
  requesting: boolean
  onRequest: () => void
  onCancel: () => void
}) {
  const device = recordKind === 'video' ? '카메라와 마이크' : '마이크'
  const errorInfo: Record<string, { title: string; desc: string; guide?: string[] }> = {
    permission: {
      title: `${device} 사용이 차단되어 있어요`,
      desc: `브라우저에서 ${device} 권한을 허용한 뒤 다시 시도해 주세요.`,
      guide: [
        '주소창 왼쪽의 자물쇠(또는 카메라) 아이콘을 누르세요.',
        `${device} 항목을 "허용"으로 바꿔 주세요.`,
        '아래 "다시 시도"를 누르세요.',
      ],
    },
    notfound: {
      title: `${device}를 찾을 수 없어요`,
      desc: `연결된 ${device} 장치가 없습니다. 장치를 연결한 뒤 다시 시도해 주세요.`,
    },
    inuse: {
      title: `${device}를 사용할 수 없어요`,
      desc: `다른 앱이나 탭에서 ${device}를 쓰고 있을 수 있어요. 닫고 다시 시도해 주세요.`,
    },
    unsupported: {
      title: '이 브라우저에서는 녹화할 수 없어요',
      desc: '최신 Chrome, Safari 등에서 다시 열어 주세요. (http 환경에서는 카메라를 쓸 수 없습니다)',
    },
    unknown: {
      title: '연습을 시작할 수 없어요',
      desc: `${device}에 접근하는 중 문제가 생겼습니다. 다시 시도해 주세요.`,
    },
  }
  const cur = error ? errorInfo[error] ?? errorInfo.unknown : null

  return (
    <div className="flash-overlay" style={{ zIndex: 200 }}>
      <div
        className="glass-card permission-gate"
        style={{
          padding: '30px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
          maxWidth: 360,
          width: '100%',
          animation: 'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <span
          className="option-icon"
          style={{
            width: 64,
            height: 64,
            color: cur ? 'var(--rose)' : 'var(--accent)',
          }}
        >
          <Icon name={recordKind === 'video' ? 'video' : 'mic'} size={32} />
        </span>

        {cur ? (
          <>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{cur.title}</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {cur.desc}
            </p>
            {cur.guide && (
              <ol
                style={{
                  textAlign: 'left',
                  margin: '2px 0 0',
                  padding: '14px 16px 14px 32px',
                  background: 'var(--accent-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  color: 'var(--text)',
                  lineHeight: 1.7,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {cur.guide.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              {device}를 켜 주세요
            </h2>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              연습을 녹화하려면 {device} 사용이 필요해요.
              <br />
              아래 버튼을 누르면 권한 요청 창이 나타납니다.
            </p>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 6 }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={requesting}
            onClick={onRequest}
            style={{ padding: '15px' }}
          >
            {requesting ? '권한 요청 중…' : cur ? '다시 시도' : `${device} 켜기`}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onCancel}>
            돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewStartPanel({
  recordKind,
  totalQuestions,
  limitEnabled,
  limitSec,
  mediaReady,
  focusKeyword,
  onStart,
}: {
  recordKind: RecordKind
  totalQuestions: number
  limitEnabled: boolean
  limitSec: number
  mediaReady: boolean
  focusKeyword?: string
  onStart: () => void
}) {
  const action = recordKind === 'video' ? '녹화' : '녹음'
  return (
    <>
      {focusKeyword && recordKind === 'video' && (
        <div className="focus-keyword-banner focus-keyword-banner--overlay">
          <p className="focus-keyword-banner__label">이번 집중 키워드</p>
          <p className="focus-keyword-banner__text">{focusKeyword}</p>
        </div>
      )}
      {totalQuestions > 1 && (
        <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, textAlign: 'center' }}>
          연속 {totalQuestions}문항 · 시간 종료 시 다음 질문
        </p>
      )}
      <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        준비되면 {action}를 시작하세요.
        {limitEnabled && ` 질문당 ${formatDuration(limitSec)}.`}
      </p>
      <button type="button" className="btn btn-primary btn-block" disabled={!mediaReady} onClick={onStart}>
        {action} 시작
      </button>
    </>
  )
}

function AudioVisualizer({ stream, active }: { stream: MediaStream | null; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (!stream || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const bg =
      getComputedStyle(document.documentElement).getPropertyValue('--media-bg').trim() || '#0f0f14'

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const w = canvas.width
      const h = canvas.height
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      analyser.getByteFrequencyData(data)
      const bars = 24
      const gap = 4
      const barW = (w - gap * (bars - 1)) / bars
      for (let i = 0; i < bars; i++) {
        const v = data[i] / 255
        const barH = Math.max(4, v * h * 0.7)
        const x = i * (barW + gap)
        const grad = ctx.createLinearGradient(0, h, 0, h - barH)
        grad.addColorStop(0, '#4ecdc4')
        grad.addColorStop(1, '#8b7cf6')
        ctx.fillStyle = active ? grad : 'rgba(139,124,246,0.3)'
        ctx.fillRect(x, h - barH, barW, barH)
      }
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      void audioCtx.close()
    }
  }, [stream, active])

  return (
    <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <span className="option-icon" style={{ width: 56, height: 56, borderRadius: 16 }}>
        <Icon name="mic" size={28} />
      </span>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>음성 녹음 모드</p>
      <canvas ref={canvasRef} width={280} height={80} style={{ width: '100%', maxWidth: 280, borderRadius: 8 }} />
    </div>
  )
}

function pickMime(kind: RecordKind): string | undefined {
  const candidates =
    kind === 'video'
      ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return candidates.find((m) => MediaRecorder.isTypeSupported(m))
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
