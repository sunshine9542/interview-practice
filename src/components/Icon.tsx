import type { ReactElement } from 'react'

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export type IconName =
  | 'home'
  | 'practice'
  | 'stats'
  | 'settings'
  | 'briefcase'
  | 'headset'
  | 'mic'
  | 'presentation'
  | 'globe'
  | 'video'
  | 'sound'
  | 'chevronLeft'
  | 'arrowRight'
  | 'check'
  | 'star'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'custom'
  | 'phone'
  | 'monitor'

const PATHS: Record<IconName, () => ReactElement> = {
  home: () => (
    <path d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5" />
  ),
  practice: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </>
  ),
  stats: () => (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  settings: () => (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </>
  ),
  briefcase: () => (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  headset: () => (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2" y="13" width="4" height="6" rx="1.5" />
      <rect x="18" y="13" width="4" height="6" rx="1.5" />
      <path d="M20 19v1a3 3 0 0 1-3 3h-2" />
    </>
  ),
  mic: () => (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  presentation: () => (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M12 16v4M8 20h8" />
    </>
  ),
  globe: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  video: () => (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3z" />
    </>
  ),
  sound: () => (
    <path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 10v4" />
  ),
  chevronLeft: () => <path d="M15 6l-6 6 6 6" />,
  arrowRight: () => <path d="M5 12h14M13 6l6 6-6 6" />,
  check: () => <path d="M4 12l5 5L20 6" />,
  star: () => (
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />
  ),
  plus: () => <path d="M12 5v14M5 12h14" />,
  edit: () => (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
    </>
  ),
  trash: () => (
    <>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </>
  ),
  custom: () => (
    <>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  phone: () => (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </>
  ),
  monitor: () => (
    <>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
}

export function Icon({ name, size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]()}
    </svg>
  )
}
