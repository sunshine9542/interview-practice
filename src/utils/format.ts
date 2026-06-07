export function formatDuration(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds))
  if (sec < 60) return `${sec}초`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s === 0 ? `${m}분` : `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function flashDurationForQuestion(
  _text: string,
  baseSeconds: number,
): number {
  return Math.min(3, Math.max(2, baseSeconds))
}

/** 녹화 중 다음 질문 배너 — 초기 플래시보다 더 길게 표시 */
export function nextQuestionBannerDuration(
  text: string,
  baseSeconds: number,
): number {
  const base = flashDurationForQuestion(text, baseSeconds)
  const extra = Math.min(3, Math.floor(text.length / 50))
  return Math.max(5, Math.min(12, Math.round(base * 1.75) + extra))
}

export function uid(): string {
  return crypto.randomUUID()
}
