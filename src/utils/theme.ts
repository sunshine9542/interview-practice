import type { LayoutMode, ThemeMode } from '../types'

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'light' ? '#f4f4f8' : '#0c0c10')
  }
}

export function applyLayout(layout: LayoutMode): void {
  document.documentElement.setAttribute('data-layout', layout)
}
