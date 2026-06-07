import { useEffect, useRef, useState } from 'react'
import { LandscapePcHint } from '../components/LandscapePcHint'
import { formatDate, formatDuration } from '../utils/format'
import { isMobileViewport } from '../utils/layout'
import type { LayoutMode, PracticeSession } from '../types'
import type { ModeInfo } from '../data/modes'
import { Icon } from '../components/Icon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface Props {
  sessions: PracticeSession[]
  modes: ModeInfo[]
  lastSession?: PracticeSession
  continueDesc: string
  layoutMode: LayoutMode
  onToggleLayout: () => void
  onStart: () => void
  onContinue: () => void
  onOpenReview: (id: string) => void
}

export function HomePage({ sessions, modes, lastSession, continueDesc, layoutMode, onToggleLayout, onStart, onContinue, onOpenReview }: Props) {
  const recent = sessions.slice(0, 5)
  const weekCount = sessions.filter((s) => s.createdAt >= Date.now() - 7 * 86400000).length
  const lastMode = lastSession ? modes.find((m) => m.id === lastSession.modeId) : undefined

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [showAllModes, setShowAllModes] = useState(false)
  const [showLandscapeHint, setShowLandscapeHint] = useState(false)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleLayoutToggle() {
    if (isMobileViewport() && layoutMode === 'portrait') {
      setShowLandscapeHint(true)
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
      hintTimerRef.current = setTimeout(() => setShowLandscapeHint(false), 4000)
      return
    }
    onToggleLayout()
  }

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)

  async function handleInstall() {
    if (installEvent) {
      await installEvent.prompt()
      await installEvent.userChoice
      setInstallEvent(null)
    } else {
      setShowInstallHelp(true)
    }
  }

  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--teal)',
              letterSpacing: '0.16em',
            }}
          >
            SELF COACHING
          </p>
          <button
            type="button"
            className="chip"
            onClick={handleLayoutToggle}
            aria-label="화면 모드 전환"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', flexShrink: 0 }}
          >
            <Icon name={layoutMode === 'portrait' ? 'phone' : 'monitor'} size={15} />
            {layoutMode === 'portrait' ? '세로' : '가로'}
          </button>
        </div>
        <h1 className="page-title" style={{ marginTop: 6, fontSize: '2rem' }}>
          인터뷰 연습
        </h1>
        <p className="page-sub" style={{ marginBottom: 0 }}>
          녹화/녹음하고, 스스로 돌아보며 성장하세요.
        </p>
      </header>

      <button type="button" className="btn btn-primary btn-block" onClick={onStart} style={{ padding: '15px' }}>
        새 연습 시작
        <Icon name="arrowRight" size={18} />
      </button>

      {lastSession && lastMode && (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={onContinue}
          style={{
            marginTop: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span className="option-icon" style={{ width: 36, height: 36, flexShrink: 0 }}>
            <Icon name={lastMode.icon} size={18} />
          </span>
          <span style={{ flex: 1, textAlign: 'left', lineHeight: 1.4 }}>
            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700 }}>
              이전 연습 계속하기
            </span>
            <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {lastMode.label} · {continueDesc}
            </span>
          </span>
          <Icon name="arrowRight" size={16} />
        </button>
      )}

      <div
        className="glass-card"
        style={{
          marginTop: 12,
          padding: '9px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <StatInline label="총 연습" value={sessions.length} />
        <span
          aria-hidden
          style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0, opacity: 0.7 }}
        />
        <StatInline label="이번 주" value={weekCount} />
      </div>

      {recent.length > 0 ? (
        <section style={{ marginTop: 18 }}>
          <h2 className="label-sm">최근 기록</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.map((s) => {
              const mode = modes.find((m) => m.id === s.modeId)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="glass-card"
                    style={{ width: '100%', padding: 14, textAlign: 'left', display: 'flex', gap: 13, alignItems: 'center' }}
                    onClick={() => onOpenReview(s.id)}
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
        </section>
      ) : (
        <section style={{ marginTop: 24 }}>
          <div
            className="glass-card"
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span className="option-icon" style={{ width: 38, height: 38, flexShrink: 0 }}>
              <Icon name="practice" size={20} />
            </span>
            <span style={{ lineHeight: 1.4 }}>
              <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700 }}>
                아직 연습 기록이 없어요
              </span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                위 버튼으로 첫 연습을 시작해 보세요.
              </span>
            </span>
          </div>

          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 className="label-sm">이런 연습을 할 수 있어요</h2>
            {(showAllModes ? modes : modes.slice(0, 2)).map((m) => (
              <div
                key={m.id}
                className="glass-card"
                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span className="option-icon" style={{ width: 36, height: 36, flexShrink: 0 }}>
                  <Icon name={m.icon} size={18} />
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem' }}>{m.label}</span>
                  <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{m.description}</span>
                </span>
              </div>
            ))}
            {modes.length > 2 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAllModes((v) => !v)}
                style={{ alignSelf: 'center', fontSize: '0.84rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {showAllModes ? '접기' : `더보기 (${modes.length - 2})`}
                <Icon name={showAllModes ? 'chevronLeft' : 'arrowRight'} size={14} />
              </button>
            )}
          </div>
        </section>
      )}

      {!isStandalone && (
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="glass-card"
          style={{
            marginTop: 26,
            width: '100%',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--accent)',
          }}
        >
          <Icon name="plus" size={16} />
          바로가기 / 즐겨찾기 추가하기
        </button>
      )}

      {showInstallHelp && <InstallHelp onClose={() => setShowInstallHelp(false)} />}

      <LandscapePcHint visible={showLandscapeHint} onClose={() => setShowLandscapeHint(false)} />
    </>
  )
}

function InstallHelp({ onClose }: { onClose: () => void }) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)

  const steps = isIOS
    ? [
        'Safari 하단(또는 상단)의 공유 버튼을 누르세요.',
        '"홈 화면에 추가"를 선택하세요.',
        '오른쪽 위 "추가"를 누르면 완료됩니다.',
      ]
    : isAndroid
      ? [
          '브라우저 오른쪽 위나 아래의 ⋮ 메뉴를 누르세요.',
          '"홈 화면에 추가"를 선택하세요.',
          '안내에 따라 추가하면 바로가기가 생깁니다.',
        ]
      : [
          '브라우저 오른쪽 위나 아래의 메뉴에서 "바로가기 만들기"를 선택하면 바탕화면에 추가돼요.',
          '또는 주소창의 별(☆) 아이콘으로 즐겨찾기에 추가하세요.',
          '추가된 바로가기로 바로 접속할 수 있어요.',
        ]

  return (
    <div
      className="flash-overlay"
      style={{ zIndex: 300, position: 'fixed' }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '26px 22px',
          maxWidth: 360,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="option-icon" style={{ width: 44, height: 44, color: 'var(--accent)' }}>
            <Icon name="plus" size={22} />
          </span>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>바로가기 / 즐겨찾기 추가</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
          바로가기를 추가하면 다음부터 한 번에 빠르게 접속할 수 있어요.
        </p>
        <ol
          style={{
            margin: 0,
            padding: '14px 16px 14px 32px',
            background: 'var(--accent-soft)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            lineHeight: 1.8,
          }}
        >
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  )
}

function StatInline({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0 }}>
      <span
        style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text)',
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  )
}
