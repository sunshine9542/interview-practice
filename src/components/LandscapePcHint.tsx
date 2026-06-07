import { Icon } from './Icon'

interface Props {
  visible: boolean
  onClose: () => void
}

export function LandscapePcHint({ visible, onClose }: Props) {
  if (!visible) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(88px + var(--safe-bottom))',
        zIndex: 250,
        maxWidth: 400,
        margin: '0 auto',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-md)',
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <span className="option-icon" style={{ width: 36, height: 36, flexShrink: 0, color: 'var(--accent)' }}>
        <Icon name="monitor" size={18} />
      </span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>
        <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700 }}>가로 모드는 PC에서만 적용돼요</span>
        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
          넓은 화면에서 가로를 선택하면 PC용 레이아웃으로 보입니다.
        </span>
      </span>
      <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: 4, flexShrink: 0 }}>
        확인
      </button>
    </div>
  )
}
