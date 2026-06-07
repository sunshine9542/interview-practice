export type BuiltinModeId = 'career' | 'media' | 'customer' | 'presentation' | 'english'
export type PracticeModeId = BuiltinModeId | (string & {})

export interface CustomMode {
  id: string
  label: string
  description: string
  questions: string[]
}

export type RecordKind = 'video' | 'audio'

export type StartMode = 'auto' | 'manual'

export type SoundType = 'ding' | 'click'

export type ThemeMode = 'dark' | 'light'

export type LayoutMode = 'portrait' | 'landscape'

export interface TimeReminderMessages {
  halfway: string
  thirtySec: string
  fiveSec: string
}

export interface TimeLimitConfig {
  enabled: boolean
  limitSeconds: number
  reminders: TimeReminderMessages
}

export interface QuickStartConfig {
  questionCount: number
  recordKind: RecordKind
  timeLimit: TimeLimitConfig
}

export interface AppSettings {
  startMode: StartMode
  countdownSeconds: number
  questionFlashSeconds: number
  soundType: SoundType
  defaultRecordKind: RecordKind
  theme: ThemeMode
  layoutMode: LayoutMode
  defaultTimeLimit: TimeLimitConfig
  quickStart: QuickStartConfig
  /** 모드별 사용자 추가 피드백 항목 */
  customFeedbackByMode: Partial<Record<string, QuestionnaireItem[]>>
}

export type QuestionnaireItemType = 'yesno' | 'scale' | 'number' | 'text'

export interface QuestionnaireItem {
  id: string
  label: string
  type: QuestionnaireItemType
  custom?: boolean
}

export interface QuestionnaireAnswer {
  itemId: string
  value: string | number | boolean
}

export interface TimestampMemo {
  id: string
  atSeconds: number
  text: string
}

export interface SessionSummary {
  wellDone: string
  improve: string
  focusNext: string
}

export interface PracticeSession {
  id: string
  createdAt: number
  modeId: PracticeModeId
  /** 대표 질문 (단일) 또는 첫 질문 */
  question: string
  /** 연속 질문 모드일 때 전체 목록 */
  questions: string[]
  recordKind: RecordKind
  blob: Blob
  mimeType: string
  durationSeconds: number
  timeLimitEnabled: boolean
  questionLimitSeconds?: number
  questionnaireAnswers: QuestionnaireAnswer[]
  memos: TimestampMemo[]
  summary: SessionSummary
}

export type View =
  | 'home'
  | 'setup'
  | 'practice'
  | 'review'
  | 'stats'
  | 'stats-scores'
  | 'records'
  | 'settings'

export const HOME_RECENT_LIMIT = 5

export interface PracticeContext {
  modeId: PracticeModeId
  recordKind: RecordKind
  questions: string[]
  timeLimit: TimeLimitConfig
  /** 질문당 시간 종료 시 다음 질문으로 (연속 질문 모드) */
  autoNextQuestion: boolean
}

export type ReminderKind = 'halfway' | 'thirtySec' | 'fiveSec'
