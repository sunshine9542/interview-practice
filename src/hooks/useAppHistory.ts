import { useCallback, useEffect, useRef, useState } from 'react'
import type { View } from '../types'

export function useAppHistory(initial: View = 'home') {
  const [view, setView] = useState<View>(initial)
  const stackRef = useRef<View[]>([initial])
  const readyRef = useRef(false)

  const applyView = useCallback((v: View) => {
    setView(v)
  }, [])

  const navigate = useCallback((next: View) => {
    if (next === stackRef.current[stackRef.current.length - 1]) return
    stackRef.current = [...stackRef.current, next]
    window.history.pushState({ view: next }, '')
    applyView(next)
  }, [applyView])

  const replace = useCallback((next: View) => {
    stackRef.current = [...stackRef.current.slice(0, -1), next]
    window.history.replaceState({ view: next }, '')
    applyView(next)
  }, [applyView])

  const resetTo = useCallback((next: View) => {
    stackRef.current = [next]
    window.history.replaceState({ view: next }, '')
    applyView(next)
  }, [applyView])

  const popPracticeForReview = useCallback(() => {
    const stack = stackRef.current
    const last = stack[stack.length - 1]
    const nextStack: View[] = last === 'practice' ? [...stack.slice(0, -1), 'review'] : [...stack, 'review']
    stackRef.current = nextStack
    window.history.replaceState({ view: 'review' }, '')
    applyView('review')
  }, [applyView])

  useEffect(() => {
    if (!readyRef.current) {
      window.history.replaceState({ view: initial }, '')
      readyRef.current = true
    }

    const onPop = () => {
      if (stackRef.current.length <= 1) {
        window.history.pushState({ view: 'home' }, '')
        stackRef.current = ['home']
        applyView('home')
        return
      }
      stackRef.current = stackRef.current.slice(0, -1)
      const prev = stackRef.current[stackRef.current.length - 1]
      applyView(prev)
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [applyView, initial])

  const goBack = useCallback(() => {
    if (stackRef.current.length <= 1) return
    window.history.back()
  }, [])

  return { view, navigate, replace, resetTo, popPracticeForReview, goBack }
}
