import type { AppSettings, CustomMode, PracticeSession } from './types'
import { DEFAULT_SETTINGS, DEFAULT_TIME_LIMIT, DEFAULT_TIME_REMINDERS, DEFAULT_QUICK_START } from './store/settings'

const DB_NAME = 'interview-practice'
const DB_VERSION = 1
const SESSIONS = 'sessions'
const SETTINGS_KEY = 'app-settings'
const CUSTOM_MODES_KEY = 'custom-modes'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(SESSIONS)) {
        db.createObjectStore(SESSIONS, { keyPath: 'id' })
      }
    }
  })
}

export async function saveSession(session: PracticeSession): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS, 'readwrite')
    tx.objectStore(SESSIONS).put(session)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSession(id: string): Promise<PracticeSession | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS, 'readonly')
    const req = tx.objectStore(SESSIONS).get(id)
    req.onsuccess = () => resolve(req.result as PracticeSession | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllSessions(): Promise<PracticeSession[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS, 'readonly')
    const req = tx.objectStore(SESSIONS).getAll()
    req.onsuccess = () => {
      const list = (req.result as PracticeSession[]).sort(
        (a, b) => b.createdAt - a.createdAt,
      )
      resolve(list)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS, 'readwrite')
    tx.objectStore(SESSIONS).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      defaultTimeLimit: {
        ...DEFAULT_TIME_LIMIT,
        ...parsed.defaultTimeLimit,
        reminders: {
          ...DEFAULT_TIME_REMINDERS,
          ...parsed.defaultTimeLimit?.reminders,
        },
      },
      quickStart: {
        ...DEFAULT_QUICK_START,
        ...parsed.quickStart,
        timeLimit: {
          ...DEFAULT_TIME_LIMIT,
          ...parsed.quickStart?.timeLimit,
          reminders: {
            ...DEFAULT_TIME_REMINDERS,
            ...parsed.quickStart?.timeLimit?.reminders,
          },
        },
      },
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadCustomModes(): CustomMode[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MODES_KEY)
    return raw ? (JSON.parse(raw) as CustomMode[]) : []
  } catch {
    return []
  }
}

export function saveCustomModes(modes: CustomMode[]): void {
  localStorage.setItem(CUSTOM_MODES_KEY, JSON.stringify(modes))
}

export async function getLatestSummary(): Promise<PracticeSession | undefined> {
  const sessions = await getAllSessions()
  return sessions.find(
    (s) => s.summary.wellDone || s.summary.improve || s.summary.focusNext,
  )
}
