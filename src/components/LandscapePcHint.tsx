import { Icon } from './Icon'

interface Props {
  visible: boolean
  onClose: () => void
}

export function LandscapePcHint({ visible, onClose }: Props) {
  if (!visible) return null

  return (
    <div
      className="flash-overlay"
      role="status"
      style={{ position: 'fixed', zIndex: 300 }}
      onClick={onClose}
    >
      <div
        className="landscape-pc-hint"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="landscape-pc-hint__icon">
          <Icon name="monitor" size={28} />
        </span>
        <h2 className="landscape-pc-hint__title">가로 모드는 PC에서만 적용돼요</h2>
        <p className="landscape-pc-hint__desc">
          넓은 화면(PC·태블릿 가로)에서 가로를 선택하면 PC용 레이아웃으로 보입니다.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  )
}
