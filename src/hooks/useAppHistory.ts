import { useCallback, useEffect, useRef, useState } from 'react'
import type { View } from '../types'

export type HistoryEntry = {
  view: View
  setupStep?: number
}

function entryKey(e: HistoryEntry): string {
  return e.view === 'setup' && e.setupStep != null ? `setup:${e.setupStep}` : e.view
}

export function useAppHistory(initial: View = 'home') {
  const [entry, setEntry] = useState<HistoryEntry>({ view: initial })
  const stackRef = useRef<HistoryEntry[]>([{ view: initial }])
  const readyRef = useRef(false)

  const applyEntry = useCallback((e: HistoryEntry) => {
    setEntry(e)
  }, [])

  const pushEntry = useCallback((next: HistoryEntry) => {
    const last = stackRef.current[stackRef.current.length - 1]
    if (entryKey(last) === entryKey(next)) return
    stackRef.current = [...stackRef.current, next]
    window.history.pushState(next, '')
    applyEntry(next)
  }, [applyEntry])

  const navigate = useCallback((next: View) => {
    const hist: HistoryEntry = next === 'setup' ? { view: 'setup', setupStep: 0 } : { view: next }
    pushEntry(hist)
  }, [pushEntry])

  const pushSetupStep = useCallback((step: number) => {
    pushEntry({ view: 'setup', setupStep: step })
  }, [pushEntry])

  const replace = useCallback((next: View) => {
    const hist: HistoryEntry = next === 'setup' ? { view: 'setup', setupStep: 0 } : { view: next }
    stackRef.current = [...stackRef.current.slice(0, -1), hist]
    window.history.replaceState(hist, '')
    applyEntry(hist)
  }, [applyEntry])

  const resetTo = useCallback((next: View) => {
    const hist: HistoryEntry = next === 'setup' ? { view: 'setup', setupStep: 0 } : { view: next }
    stackRef.current = [hist]
    window.history.replaceState(hist, '')
    applyEntry(hist)
  }, [applyEntry])

  const popPracticeForReview = useCallback(() => {
    const stack = stackRef.current
    const last = stack[stack.length - 1]
    const nextStack: HistoryEntry[] =
      last.view === 'practice' ? [...stack.slice(0, -1), { view: 'review' }] : [...stack, { view: 'review' }]
    stackRef.current = nextStack
    window.history.replaceState({ view: 'review' }, '')
    applyEntry({ view: 'review' })
  }, [applyEntry])

  useEffect(() => {
    if (!readyRef.current) {
      window.history.replaceState({ view: initial }, '')
      readyRef.current = true
    }

    const onPop = (event: PopStateEvent) => {
      if (stackRef.current.length <= 1) {
        window.history.pushState({ view: 'home' }, '')
        stackRef.current = [{ view: 'home' }]
        applyEntry({ view: 'home' })
        return
      }

      stackRef.current = stackRef.current.slice(0, -1)
      const state = event.state as HistoryEntry | null
      const fallback = stackRef.current[stackRef.current.length - 1]
      applyEntry(state?.view ? state : fallback)
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [applyEntry, initial])

  const goBack = useCallback(() => {
    if (stackRef.current.length <= 1) return
    window.history.back()
  }, [])

  return {
    view: entry.view,
    setupStep: entry.setupStep ?? 0,
    navigate,
    pushSetupStep,
    replace,
    resetTo,
    popPracticeForReview,
    goBack,
  }
}
