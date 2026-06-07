import { useCallback, useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import {
  deleteSession,
  getAllSessions,
  getLatestSummary,
  getSession,
  loadCustomModes,
  loadSettings,
  saveCustomModes,
  saveSession,
  saveSettings,
} from './db'
import { HomePage } from './pages/HomePage'
import { SetupPage } from './pages/SetupPage'
import { PracticePage } from './pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { applyLayout, applyTheme } from './utils/theme'
import { getAllModes } from './data/modes'
import { pickMultipleQuestions, pickRandomQuestion, setCustomModes } from './data/questions'
import { formatDuration, uid } from './utils/format'
import type {
  AppSettings,
  CustomMode,
  PracticeModeId,
  PracticeContext,
  PracticeSession,
  RecordKind,
  View,
} from './types'

function normalizeSession(raw: PracticeSession): PracticeSession {
  return {
    ...raw,
    questions: raw.questions?.length ? raw.questions : [raw.question],
  }
}

export default function App() {
  const [view, setView] = useState<View>('home')
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [practiceContext, setPracticeContext] = useState<PracticeContext | null>(null)
  const [reviewSession, setReviewSession] = useState<PracticeSession | null>(null)
  const [reviewIsNew, setReviewIsNew] = useState(false)
  const [lastSummary, setLastSummary] = useState<PracticeSession | undefined>()
  const [customModes, setCustomModesState] = useState<CustomMode[]>(() => {
    const m = loadCustomModes()
    setCustomModes(m)
    return m
  })

  const modes = getAllModes(customModes)

  const handleAddMode = (mode: CustomMode) => {
    const next = [...customModes, mode]
    setCustomModesState(next)
    saveCustomModes(next)
    setCustomModes(next)
  }

  const handleDeleteMode = (id: string) => {
    const next = customModes.filter((m) => m.id !== id)
    setCustomModesState(next)
    saveCustomModes(next)
    setCustomModes(next)
  }

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  useEffect(() => {
    applyLayout(settings.layoutMode)
  }, [settings.layoutMode])

  const refreshSessions = useCallback(async () => {
    const list = (await getAllSessions()).map(normalizeSession)
    setSessions(list)
    const latest = await getLatestSummary()
    setLastSummary(latest ? normalizeSession(latest) : undefined)
  }, [])

  useEffect(() => {
    void refreshSessions()
  }, [refreshSessions])

  const handleSettingsChange = (s: AppSettings) => {
    setSettings(s)
    saveSettings(s)
  }

  const openReview = async (id: string) => {
    const s = await getSession(id)
    if (s) {
      setReviewSession(normalizeSession(s))
      setReviewIsNew(false)
      setView('review')
    }
  }

  const handlePracticeComplete = (blob: Blob, mimeType: string, durationSeconds: number) => {
    if (!practiceContext) return
    const { questions, modeId, recordKind, timeLimit } = practiceContext
    const session: PracticeSession = {
      id: uid(),
      createdAt: Date.now(),
      modeId,
      question: questions.length > 1 ? questions[0] : questions[0],
      questions,
      recordKind,
      blob,
      mimeType,
      durationSeconds,
      timeLimitEnabled: timeLimit.enabled,
      questionLimitSeconds: timeLimit.enabled ? timeLimit.limitSeconds : undefined,
      questionnaireAnswers: [],
      memos: [],
      summary: { wellDone: '', improve: '', focusNext: '' },
    }
    setReviewSession(session)
    setReviewIsNew(true)
    setPracticeContext(null)
    setView('review')
  }

  const handleQuickStart = (modeId: PracticeModeId) => {
    const qs = settings.quickStart
    const isCareer = modeId === 'career'
    const count = isCareer ? qs.questionCount : 1
    const questions =
      count > 1
        ? pickMultipleQuestions(modeId, count)
        : [pickRandomQuestion(modeId)]
    const multiMode = isCareer && count > 1
    const ctx: PracticeContext = {
      modeId,
      recordKind: qs.recordKind,
      questions,
      timeLimit: qs.timeLimit,
      autoNextQuestion: multiMode && qs.timeLimit.enabled,
    }
    setPracticeContext(ctx)
    setView('practice')
  }

  const handleContinue = () => {
    const last = sessions[0]
    if (!last) return
    const isCareer = last.modeId === 'career'
    const count = last.questions.length
    const tl = last.timeLimitEnabled && last.questionLimitSeconds
      ? { enabled: true, limitSeconds: last.questionLimitSeconds, reminders: settings.defaultTimeLimit.reminders }
      : { ...settings.defaultTimeLimit, enabled: false }
    const questions =
      count > 1
        ? pickMultipleQuestions(last.modeId, count)
        : [pickRandomQuestion(last.modeId)]
    const multiMode = isCareer && count > 1
    const ctx: PracticeContext = {
      modeId: last.modeId,
      recordKind: last.recordKind,
      questions,
      timeLimit: tl,
      autoNextQuestion: multiMode && tl.enabled,
    }
    setPracticeContext(ctx)
    setView('practice')
  }

  function buildDetailParts(
    recordKind: RecordKind,
    qCount: number,
    timeLimitEnabled: boolean,
    limitSeconds: number,
  ): string {
    const parts: string[] = []
    parts.push(recordKind === 'video' ? '영상 + 음성' : '녹음만')
    parts.push(qCount > 1 ? `연속 ${qCount}문항` : '질문 1개')
    parts.push(timeLimitEnabled ? `질문당 ${formatDuration(limitSeconds)}` : '시간 제한 없음')
    return parts.join(' · ')
  }

  const handleSaveSession = async (session: PracticeSession) => {
    await saveSession(normalizeSession(session))
    await refreshSessions()
    setReviewSession(session)
  }

  if (view === 'practice' && practiceContext) {
    return (
      <PracticePage
        settings={settings}
        context={practiceContext}
        onCancel={() => {
          setPracticeContext(null)
          setView('setup')
        }}
        onComplete={handlePracticeComplete}
      />
    )
  }

  if (view === 'review' && reviewSession) {
    return (
      <ReviewPage
        session={normalizeSession(reviewSession)}
        isNew={reviewIsNew}
        onSave={handleSaveSession}
        onDelete={
          reviewIsNew
            ? undefined
            : async () => {
                await deleteSession(reviewSession.id)
                await refreshSessions()
                setReviewSession(null)
                setView('home')
              }
        }
        onDone={async (updated) => {
          await saveSession(normalizeSession(updated))
          await refreshSessions()
          setReviewSession(null)
          setReviewIsNew(false)
          setView('home')
        }}
      />
    )
  }

  return (
    <Layout view={view} onNavigate={setView}>
      {view === 'home' && (
        <HomePage
          sessions={sessions}
          modes={modes}
          lastSession={sessions[0]}
          continueDesc={
            sessions[0]
              ? buildDetailParts(
                  sessions[0].recordKind,
                  sessions[0].questions.length,
                  sessions[0].timeLimitEnabled,
                  sessions[0].questionLimitSeconds ?? 0,
                )
              : ''
          }
          layoutMode={settings.layoutMode}
          onToggleLayout={() =>
            handleSettingsChange({
              ...settings,
              layoutMode: settings.layoutMode === 'portrait' ? 'landscape' : 'portrait',
            })
          }
          onStart={() => setView('setup')}
          onContinue={handleContinue}
          onOpenReview={(id) => void openReview(id)}
        />
      )}
      {view === 'setup' && (
        <SetupPage
          settings={settings}
          modes={modes}
          lastSummary={lastSummary}
          onBack={() => setView('home')}
          onStart={(ctx) => {
            setPracticeContext(ctx)
            setView('practice')
          }}
          onQuickStart={handleQuickStart}
          onAddMode={handleAddMode}
          onDeleteMode={handleDeleteMode}
        />
      )}
      {view === 'stats' && <StatsPage sessions={sessions} modes={modes} />}
      {view === 'settings' && (
        <SettingsPage settings={settings} onChange={handleSettingsChange} />
      )}
    </Layout>
  )
}
