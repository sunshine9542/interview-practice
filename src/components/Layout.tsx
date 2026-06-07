import type { ReactNode } from 'react'
import type { View } from '../types'
import { Icon, type IconName } from './Icon'

interface LayoutProps {
  children: ReactNode
  view: View
  onNavigate: (view: View) => void
  hideNav?: boolean
}

const NAV: { view: View; icon: IconName; label: string }[] = [
  { view: 'home', icon: 'home', label: '홈' },
  { view: 'setup', icon: 'practice', label: '연습' },
  { view: 'stats', icon: 'stats', label: '통계' },
  { view: 'settings', icon: 'settings', label: '설정' },
]

export function Layout({ children, view, onNavigate, hideNav }: LayoutProps) {
  const showNav = !hideNav && view !== 'practice' && view !== 'review'
  return (
    <div className="app-shell">
      <div className="app-content">
        {children}
      </div>
      {showNav && (
        <nav className="nav-bar" aria-label="메인">
          {NAV.map((item) => (
            <button
              key={item.view}
              type="button"
              className={`nav-item ${view === item.view ? 'active' : ''}`}
              onClick={() => onNavigate(item.view)}
            >
              <Icon name={item.icon} size={21} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
