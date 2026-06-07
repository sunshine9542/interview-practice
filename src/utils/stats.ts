import { getQuestionnaireTemplate } from '../data/questionnaires'
import type { AppSettings, PracticeModeId, PracticeSession, QuestionnaireItem } from '../types'

export interface ItemAverage {
  itemId: string
  label: string
  type: QuestionnaireItem['type']
  average: number | null
  yesPercent: number | null
  count: number
  custom?: boolean
}

export interface DailyCount {
  label: string
  dateKey: string
  count: number
}

export interface WeeklyScore {
  label: string
  weekStart: number
  average: number
}

export interface DailyScore {
  label: string
  dateKey: string
  timestamp: number
  average: number
  sessionCount: number
}

function itemLabelsForMode(
  settings: AppSettings,
  modeId: PracticeModeId,
): Map<string, { label: string; type: QuestionnaireItem['type']; custom?: boolean }> {
  const map = new Map<string, { label: string; type: QuestionnaireItem['type']; custom?: boolean }>()
  const custom = settings.customFeedbackByMode[modeId] ?? []
  getQuestionnaireTemplate(modeId, custom).forEach((item) => {
    map.set(item.id, { label: item.label, type: item.type, custom: item.custom })
  })
  return map
}

function allItemLabels(settings: AppSettings): Map<string, { label: string; type: QuestionnaireItem['type']; custom?: boolean }> {
  const map = new Map<string, { label: string; type: QuestionnaireItem['type']; custom?: boolean }>()
  const modeIds = new Set<string>()
  for (const key of Object.keys(settings.customFeedbackByMode)) modeIds.add(key)
  for (const id of ['career', 'customer', 'media', 'presentation', 'english']) modeIds.add(id)

  modeIds.forEach((modeId) => {
    itemLabelsForMode(settings, modeId).forEach((meta, itemId) => map.set(itemId, meta))
  })
  return map
}

export function computeItemAverages(
  sessions: PracticeSession[],
  settings: AppSettings,
  modeId?: PracticeModeId,
): ItemAverage[] {
  const filtered = modeId ? sessions.filter((s) => s.modeId === modeId) : sessions
  const labels = modeId ? itemLabelsForMode(settings, modeId) : allItemLabels(settings)
  const sums = new Map<string, { scaleSum: number; scaleCount: number; yes: number; yesCount: number }>()

  filtered.forEach((s) => {
    s.questionnaireAnswers.forEach((a) => {
      const meta = labels.get(a.itemId)
      if (!meta) return
      const cur = sums.get(a.itemId) ?? { scaleSum: 0, scaleCount: 0, yes: 0, yesCount: 0 }
      if (meta.type === 'scale' && typeof a.value === 'number' && a.value >= 1 && a.value <= 5) {
        cur.scaleSum += a.value
        cur.scaleCount += 1
      }
      if (meta.type === 'yesno' && typeof a.value === 'boolean') {
        cur.yesCount += 1
        if (a.value) cur.yes += 1
      }
      sums.set(a.itemId, cur)
    })
  })

  const result: ItemAverage[] = []
  labels.forEach((meta, itemId) => {
    const cur = sums.get(itemId)
    if (!cur || (cur.scaleCount === 0 && cur.yesCount === 0)) return
    result.push({
      itemId,
      label: meta.label,
      type: meta.type,
      custom: meta.custom,
      count: meta.type === 'scale' ? cur.scaleCount : cur.yesCount,
      average: cur.scaleCount > 0 ? cur.scaleSum / cur.scaleCount : null,
      yesPercent: cur.yesCount > 0 ? Math.round((cur.yes / cur.yesCount) * 100) : null,
    })
  })

  return result.sort((a, b) => {
    if (a.type === 'scale' && b.type === 'scale') return (b.average ?? 0) - (a.average ?? 0)
    return a.label.localeCompare(b.label, 'ko')
  })
}

export function computeOverallScaleAverage(sessions: PracticeSession[], modeId?: PracticeModeId): number | null {
  const filtered = modeId ? sessions.filter((s) => s.modeId === modeId) : sessions
  const scores: number[] = []
  filtered.forEach((s) => {
    s.questionnaireAnswers.forEach((a) => {
      if (typeof a.value === 'number' && a.value >= 1 && a.value <= 5) scores.push(a.value)
    })
  })
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

export function computeDailyCounts(sessions: PracticeSession[], days = 7): DailyCount[] {
  const result: DailyCount[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const start = d.getTime()
    const end = start + 86400000
    const label = i === 0 ? '오늘' : new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(d)
    result.push({
      label,
      dateKey: d.toISOString().slice(0, 10),
      count: sessions.filter((s) => s.createdAt >= start && s.createdAt < end).length,
    })
  }
  return result
}

export function computeDailyScoreTrend(sessions: PracticeSession[]): DailyScore[] {
  const byDay = new Map<string, { scores: number[]; ts: number; sessionIds: Set<string> }>()

  sessions.forEach((s) => {
    const dayScores: number[] = []
    s.questionnaireAnswers.forEach((a) => {
      if (typeof a.value === 'number' && a.value >= 1 && a.value <= 5) dayScores.push(a.value)
    })
    if (dayScores.length === 0) return

    const d = new Date(s.createdAt)
    d.setHours(0, 0, 0, 0)
    const dateKey = d.toISOString().slice(0, 10)
    const cur = byDay.get(dateKey) ?? { scores: [], ts: d.getTime(), sessionIds: new Set<string>() }
    cur.scores.push(...dayScores)
    cur.sessionIds.add(s.id)
    byDay.set(dateKey, cur)
  })

  return Array.from(byDay.values())
    .sort((a, b) => a.ts - b.ts)
    .map(({ scores, ts, sessionIds }) => {
      const d = new Date(ts)
      const label = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(d)
      return {
        label,
        dateKey: d.toISOString().slice(0, 10),
        timestamp: ts,
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
        sessionCount: sessionIds.size,
      }
    })
}

export function computeWeeklyScoreTrend(sessions: PracticeSession[], weeks = 6): WeeklyScore[] {
  const result: WeeklyScore[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() + mondayOffset)

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - i * 7)
    const weekEnd = weekStart.getTime() + 7 * 86400000
    const weekSessions = sessions.filter(
      (s) => s.createdAt >= weekStart.getTime() && s.createdAt < weekEnd,
    )
    const scores: number[] = []
    weekSessions.forEach((s) => {
      s.questionnaireAnswers.forEach((a) => {
        if (typeof a.value === 'number' && a.value >= 1 && a.value <= 5) scores.push(a.value)
      })
    })
    if (scores.length === 0) continue
    const label =
      i === 0
        ? '이번 주'
        : new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(weekStart)
    result.push({
      label,
      weekStart: weekStart.getTime(),
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
    })
  }
  return result
}
