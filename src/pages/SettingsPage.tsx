import { useRef, useState } from 'react'
import { LandscapePcHint } from '../components/LandscapePcHint'
import { TimeLimitFields } from '../components/TimeLimitFields'
import { playCue, unlockAudio } from '../utils/sound'
import { isMobileViewport } from '../utils/layout'
import type { ModeInfo } from '../data/modes'
import { getCustomFeedbackItems } from '../data/questionnaires'
import type { AppSettings, LayoutMode, PracticeModeId, QuickStartConfig, SoundType, StartMode, ThemeMode } from '../types'

interface Props {
  settings: AppSettings
  modes: ModeInfo[]
  onChange: (s: AppSettings) => void
  onRemoveFeedbackItem: (modeId: PracticeModeId, itemId: string) => void
}

export function SettingsPage({ settings, modes, onChange, onRemoveFeedbackItem }: Props) {
  const [feedbackModeId, setFeedbackModeId] = useState<PracticeModeId>(modes[0]?.id ?? 'career')
  const customItems = getCustomFeedbackItems(settings, feedbackModeId)
  const [showLandscapeHint, setShowLandscapeHint] = useState(false)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const patch = (partial: Partial<AppSettings>) => onChange({ ...settings, ...partial })
  const patchQS = (partial: Partial<QuickStartConfig>) =>
    patch({ quickStart: { ...settings.quickStart, ...partial } })

  function selectLayout(mode: LayoutMode) {
    if (mode === 'landscape' && isMobileViewport()) {
      setShowLandscapeHint(true)
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
      hintTimerRef.current = setTimeout(() => setShowLandscapeHint(false), 4000)
      return
    }
    patch({ layoutMode: mode })
  }

  return (
    <>
      <h1 className="page-title">설정</h1>
      <p className="page-sub">테마, 연습 방식, 알림음을 조절하세요.</p>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">화면 테마</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={`chip ${settings.theme === 'light' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patch({ theme: 'light' as ThemeMode })}
          >
            라이트
          </button>
          <button
            type="button"
            className={`chip ${settings.theme === 'dark' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patch({ theme: 'dark' as ThemeMode })}
          >
            다크
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">화면 모드</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          세로는 스마트폰, 가로는 PC·태블릿 넓은 화면에 적합합니다.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={`chip ${settings.layoutMode === 'portrait' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => selectLayout('portrait')}
          >
            세로 (모바일)
          </button>
          <button
            type="button"
            className={`chip ${settings.layoutMode === 'landscape' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => selectLayout('landscape')}
          >
            가로 (PC)
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">빠른 시작 설정</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          면접 종류를 선택한 뒤 빠른 시작을 누르면 아래 설정으로 바로 연습에 들어갑니다.
        </p>

        <label className="label-sm">질문 수</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1, 3, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`chip ${settings.quickStart.questionCount === n ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => patchQS({ questionCount: n })}
            >
              {n === 1 ? '1개' : `연속 ${n}문항`}
            </button>
          ))}
        </div>

        <label className="label-sm">녹화 방식</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`chip ${settings.quickStart.recordKind === 'video' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patchQS({ recordKind: 'video' })}
          >
            영상
          </button>
          <button
            type="button"
            className={`chip ${settings.quickStart.recordKind === 'audio' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patchQS({ recordKind: 'audio' })}
          >
            녹음만
          </button>
        </div>

        <label className="label-sm">시간 제한</label>
        <TimeLimitFields
          value={settings.quickStart.timeLimit}
          onChange={(timeLimit) => patchQS({ timeLimit })}
        />
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">기본 시간 제한</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          연습 설정 화면의 초기값입니다. 절반·30초·5초 전 메시지를 기본으로 넣을 수 있어요.
        </p>
        <TimeLimitFields
          value={settings.defaultTimeLimit}
          onChange={(defaultTimeLimit) => patch({ defaultTimeLimit })}
        />
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">녹화 시작 흐름</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
          질문 표시(5~9초) → 카운트다운 → 자동 녹화 시작
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={`chip ${settings.startMode === 'manual' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patch({ startMode: 'manual' as StartMode })}
          >
            버튼으로 시작
          </button>
          <button
            type="button"
            className={`chip ${settings.startMode === 'auto' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patch({ startMode: 'auto' as StartMode })}
          >
            자동 시작
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">질문 표시 알림음</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={`chip ${settings.soundType === 'ding' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              patch({ soundType: 'ding' as SoundType })
              unlockAudio()
              playCue('ding')
            }}
          >
            띵
          </button>
          <button
            type="button"
            className={`chip ${settings.soundType === 'click' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              patch({ soundType: 'click' as SoundType })
              unlockAudio()
              playCue('click')
            }}
          >
            딸깍
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">질문 표시 시간 (5~9초 · 기본 {settings.questionFlashSeconds}초)</h2>
        <input
          type="range"
          min={5}
          max={9}
          value={Math.max(5, Math.min(9, settings.questionFlashSeconds))}
          onChange={(e) => patch({ questionFlashSeconds: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">카운트다운</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          질문 표시 후 <strong>3 · 2 · 1</strong> 카운트다운 뒤 자동 녹화가 시작됩니다.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">기본 녹화 방식</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={`chip ${settings.defaultRecordKind === 'video' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patch({ defaultRecordKind: 'video' })}
          >
            영상
          </button>
          <button
            type="button"
            className={`chip ${settings.defaultRecordKind === 'audio' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => patch({ defaultRecordKind: 'audio' })}
          >
            녹음만
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 className="label-sm">내 피드백 항목</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          리뷰 화면에서 추가한 항목이 여기에도 표시됩니다. 모드별로 관리할 수 있어요.
        </p>
        <select
          className="input-field"
          value={feedbackModeId}
          onChange={(e) => setFeedbackModeId(e.target.value)}
          style={{ marginBottom: 12 }}
        >
          {modes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {customItems.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            추가된 항목이 없습니다. 연습 후 리뷰에서 추가해 보세요.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {customItems.map((item) => (
              <li
                key={item.id}
                className="glass-card"
                style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {item.label}
                  <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {item.type === 'scale' ? '1~5' : '예/아니오'}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '0.76rem', color: 'var(--rose)' }}
                  onClick={() => onRemoveFeedbackItem(feedbackModeId, item.id)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="glass-card" style={{ padding: 16, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        모든 녹화·총평은 기기에만 저장됩니다. 서버로 전송하지 않습니다.
      </div>

      <LandscapePcHint visible={showLandscapeHint} onClose={() => setShowLandscapeHint(false)} />
    </>
  )
}
