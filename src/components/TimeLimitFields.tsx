import type { TimeLimitConfig } from '../types'
import { formatDuration } from '../utils/format'

interface Props {
  value: TimeLimitConfig
  onChange: (v: TimeLimitConfig) => void
  showMultiHint?: boolean
}

const SLIDER_MIN = 30
const SLIDER_MAX = 300
const SLIDER_STEP = 30
const TICKS = Array.from(
  { length: (SLIDER_MAX - SLIDER_MIN) / SLIDER_STEP + 1 },
  (_, i) => SLIDER_MIN + i * SLIDER_STEP,
)

export function TimeLimitFields({ value, onChange, showMultiHint }: Props) {
  const patch = (partial: Partial<TimeLimitConfig>) => onChange({ ...value, ...partial })
  const patchReminder = (key: keyof TimeLimitConfig['reminders'], text: string) =>
    onChange({
      ...value,
      reminders: { ...value.reminders, [key]: text },
    })

  const minutes = Math.floor(value.limitSeconds / 60)
  const seconds = value.limitSeconds % 60

  function setFromMinSec(m: number, s: number) {
    const total = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, m * 60 + s))
    patch({ limitSeconds: total, enabled: true })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label className="label-sm" style={{ margin: 0 }}>
            질문당 시간 ({formatDuration(value.limitSeconds)})
          </label>
          <button
            type="button"
            className={`chip ${!value.enabled ? 'active' : ''}`}
            onClick={() => patch({ enabled: !value.enabled })}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
          >
            {value.enabled ? '제한 끄기' : '제한 없음'}
          </button>
        </div>

        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          value={value.limitSeconds}
          disabled={!value.enabled}
          onChange={(e) => patch({ limitSeconds: Number(e.target.value), enabled: true })}
          style={{ width: '100%', accentColor: 'var(--teal)', opacity: value.enabled ? 1 : 0.35 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginTop: 2 }}>
          {TICKS.map((t) => (
            <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 0 }}>
              <span
                style={{
                  display: 'block',
                  width: 1,
                  height: value.limitSeconds === t ? 8 : 5,
                  background: value.limitSeconds === t ? 'var(--teal)' : 'var(--text-muted)',
                  opacity: value.enabled ? (value.limitSeconds === t ? 1 : 0.4) : 0.2,
                  borderRadius: 1,
                }}
              />
              <span
                style={{
                  fontSize: '0.62rem',
                  color: value.limitSeconds === t ? 'var(--teal)' : 'var(--text-muted)',
                  opacity: value.enabled ? (value.limitSeconds === t ? 1 : 0.6) : 0.25,
                  marginTop: 2,
                  fontWeight: value.limitSeconds === t ? 700 : 400,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {t < 60 ? `${t}초` : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            opacity: value.enabled ? 1 : 0.35,
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
            직접 설정
          </span>
          <input
            type="number"
            className="input-field"
            min={0}
            max={5}
            value={minutes}
            disabled={!value.enabled}
            onChange={(e) => setFromMinSec(Math.max(0, Math.min(5, Number(e.target.value))), seconds)}
            style={{ width: 52, textAlign: 'center', padding: '6px 4px', fontSize: '0.9rem' }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>분</span>
          <input
            type="number"
            className="input-field"
            min={0}
            max={59}
            step={1}
            value={seconds}
            disabled={!value.enabled}
            onChange={(e) => setFromMinSec(minutes, Math.max(0, Math.min(59, Number(e.target.value))))}
            style={{ width: 52, textAlign: 'center', padding: '6px 4px', fontSize: '0.9rem' }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>초</span>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '10px 0 0' }}>
          {value.enabled
            ? '절반 · 30초 전 · 5초 전에 알림과 메시지가 표시됩니다.'
            : '슬라이더를 움직이면 시간 제한이 켜집니다.'}
        </p>
      </div>

      {showMultiHint && value.enabled && (
        <p
          className="glass-card"
          style={{
            padding: 12,
            margin: 0,
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            borderColor: 'var(--accent-soft)',
          }}
        >
          연속 모드: 질문당 시간이 끝나면 녹화는 이어지고{' '}
          <strong style={{ color: 'var(--text)' }}>다음 질문</strong>이 자동으로 표시됩니다.
        </p>
      )}

      {value.enabled && (
        <>
          <ReminderInput
            label="절반 시점"
            value={value.reminders.halfway}
            onChange={(t) => patchReminder('halfway', t)}
          />
          <ReminderInput
            label="30초 전"
            value={value.reminders.thirtySec}
            onChange={(t) => patchReminder('thirtySec', t)}
          />
          <ReminderInput
            label="5초 전"
            value={value.reminders.fiveSec}
            onChange={(t) => patchReminder('fiveSec', t)}
          />
        </>
      )}
    </div>
  )
}

function ReminderInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="label-sm" style={{ textTransform: 'none', letterSpacing: 0 }}>
        {label} — 명심할 말
      </label>
      <input
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="직접 입력"
      />
    </div>
  )
}
