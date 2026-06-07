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
  text: string,
  baseSeconds: number,
): number {
  const extra = Math.min(4, Math.floor(text.length / 40))
  return Math.max(3, Math.min(8, baseSeconds + extra))
}

export function uid(): string {
  return crypto.randomUUID()
}
