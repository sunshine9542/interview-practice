import type { AppSettings, QuickStartConfig, TimeLimitConfig } from '../types'

export const DEFAULT_TIME_REMINDERS: TimeLimitConfig['reminders'] = {
  halfway: '절반 지났어요. 핵심만 말하세요.',
  thirtySec: '30초 남았습니다. 마무리를 준비하세요.',
  fiveSec: '5초 후 시간이 끝납니다.',
}

export const DEFAULT_TIME_LIMIT: TimeLimitConfig = {
  enabled: true,
  limitSeconds: 120,
  reminders: { ...DEFAULT_TIME_REMINDERS },
}

export const DEFAULT_QUICK_START: QuickStartConfig = {
  questionCount: 1,
  recordKind: 'video',
  timeLimit: { ...DEFAULT_TIME_LIMIT, reminders: { ...DEFAULT_TIME_REMINDERS } },
}

export const DEFAULT_SETTINGS: AppSettings = {
  startMode: 'manual',
  countdownSeconds: 3,
  questionFlashSeconds: 4,
  soundType: 'ding',
  defaultRecordKind: 'video',
  theme: 'light',
  layoutMode: 'portrait',
  defaultTimeLimit: { ...DEFAULT_TIME_LIMIT, reminders: { ...DEFAULT_TIME_REMINDERS } },
  quickStart: { ...DEFAULT_QUICK_START, timeLimit: { ...DEFAULT_TIME_LIMIT, reminders: { ...DEFAULT_TIME_REMINDERS } } },
}
