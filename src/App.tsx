import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useAppHistory } from './hooks/useAppHistory'
import { HomePage } from './pages/HomePage'
import { SetupPage } from './pages/SetupPage'
import { PracticePage } from './pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'
import { StatsPage } from './pages/StatsPage'
import { ScoreDetailPage } from './pages/ScoreDetailPage'
import { RecordsPage } from './pages/RecordsPage'
import { SettingsPage } from './pages/SettingsPage'
import { applyLayout, applyTheme } from './utils/theme'
import { getAllModes } from './data/modes'
import { pickMultipleQuestions, pickRandomQuestion, setCustomModes } from './data/questions'
import { computeItemAverages, computeOverallScaleAverage } from './utils/stats'
import { formatDuration, uid } from './utils/format'
import type {
  AppSettings,
  CustomMode,
  PracticeModeId,
  PracticeContext,
  PracticeSession,
  QuestionnaireItem,
  RecordKind,
} from './types'

function normalizeSession(raw: PracticeSession): PracticeSession {
  return {
    ...raw,
    questions: raw.questions?.length ? raw.questions : [raw.question],
  }
}

export default function App() {
  const { view, setupStep, navigate, pushSetupStep, resetTo, popPracticeForReview, goBack } =
    useAppHistory('home')
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
  const focusKeyword = lastSummary?.summary.focusNext?.trim() || undefined

  const scoreItems = useMemo(() => computeItemAverages(sessions, settings), [sessions, settings])
  const overallScore = useMemo(() => computeOverallScaleAverage(sessions), [sessions])

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

  useEffect(() => {
    if (view !== 'practice') setPracticeContext(null)
    if (view !== 'review') {
      setReviewSession(null)
      setReviewIsNew(false)
    }
  }, [view])

  const handleSettingsChange = (s: AppSettings) => {
    setSettings(s)
    saveSettings(s)
  }

  const handleAddFeedbackItem = (modeId: PracticeModeId, item: QuestionnaireItem) => {
    const prev = settings.customFeedbackByMode[modeId] ?? []
    handleSettingsChange({
      ...settings,
      customFeedbackByMode: {
        ...settings.customFeedbackByMode,
        [modeId]: [...prev, item],
      },
    })
  }

  const handleRemoveFeedbackItem = (modeId: PracticeModeId, itemId: string) => {
    const prev = settings.customFeedbackByMode[modeId] ?? []
    handleSettingsChange({
      ...settings,
      customFeedbackByMode: {
        ...settings.customFeedbackByMode,
        [modeId]: prev.filter((i) => i.id !== itemId),
      },
    })
  }

  const openReview = async (id: string) => {
    const s = await getSession(id)
    if (s) {
      setReviewSession(normalizeSession(s))
      setReviewIsNew(false)
      navigate('review')
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
    popPracticeForReview()
  }

  const handleQuickStart = (modeId: PracticeModeId) => {
    const qs = settings.quickStart
    const count = qs.questionCount
    const questions =
      count > 1 ? pickMultipleQuestions(modeId, count) : [pickRandomQuestion(modeId)]
    const multiMode = count > 1
    const ctx: PracticeContext = {
      modeId,
      recordKind: qs.recordKind,
      questions,
      timeLimit: qs.timeLimit,
      autoNextQuestion: multiMode && qs.timeLimit.enabled,
    }
    setPracticeContext(ctx)
    navigate('practice')
  }

  const handleContinue = () => {
    const last = sessions[0]
    if (!last) return
    const count = last.questions.length
    const tl =
      last.timeLimitEnabled && last.questionLimitSeconds
        ? {
            enabled: true,
            limitSeconds: last.questionLimitSeconds,
            reminders: settings.defaultTimeLimit.reminders,
          }
        : { ...settings.defaultTimeLimit, enabled: false }
    const questions =
      count > 1 ? pickMultipleQuestions(last.modeId, count) : [pickRandomQuestion(last.modeId)]
    const multiMode = count > 1
    const ctx: PracticeContext = {
      modeId: last.modeId,
      recordKind: last.recordKind,
      questions,
      timeLimit: tl,
      autoNextQuestion: multiMode && tl.enabled,
    }
    setPracticeContext(ctx)
    navigate('practice')
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

  const handleNavTab = (v: typeof view) => {
    if (v === view) return
    resetTo(v)
    setPracticeContext(null)
    setReviewSession(null)
    setReviewIsNew(false)
  }

  if (view === 'practice' && practiceContext) {
    return (
      <PracticePage
        settings={settings}
        context={practiceContext}
        focusKeyword={focusKeyword}
        onCancel={goBack}
        onComplete={handlePracticeComplete}
      />
    )
  }

  if (view === 'review' && reviewSession) {
    return (
      <ReviewPage
        session={normalizeSession(reviewSession)}
        isNew={reviewIsNew}
        settings={settings}
        onSave={handleSaveSession}
        onAddFeedbackItem={handleAddFeedbackItem}
        onRemoveFeedbackItem={handleRemoveFeedbackItem}
        onDelete={
          reviewIsNew
            ? undefined
            : async () => {
                await deleteSession(reviewSession.id)
                await refreshSessions()
                setReviewSession(null)
                resetTo('home')
              }
        }
        onDone={async (updated) => {
          await saveSession(normalizeSession(updated))
          await refreshSessions()
          setReviewSession(null)
          setReviewIsNew(false)
          resetTo('home')
        }}
      />
    )
  }

  return (
    <Layout view={view} onNavigate={handleNavTab}>
      {view === 'home' && (
        <HomePage
          sessions={sessions}
          modes={modes}
          lastSession={sessions[0]}
          lastSummary={lastSummary}
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
          onStart={() => navigate('setup')}
          onContinue={handleContinue}
          onOpenReview={(id) => void openReview(id)}
          onOpenAllRecords={() => navigate('records')}
        />
      )}
      {view === 'setup' && (
        <SetupPage
          settings={settings}
          modes={modes}
          stepIndex={setupStep}
          onBack={goBack}
          onStepChange={pushSetupStep}
          onStart={(ctx) => {
            setPracticeContext(ctx)
            navigate('practice')
          }}
          onQuickStart={handleQuickStart}
          onAddMode={handleAddMode}
          onDeleteMode={handleDeleteMode}
        />
      )}
      {view === 'stats' && (
        <StatsPage
          sessions={sessions}
          modes={modes}
          onOpenScores={() => navigate('stats-scores')}
        />
      )}
      {view === 'stats-scores' && (
        <ScoreDetailPage
          items={scoreItems}
          overall={overallScore}
          onBack={goBack}
        />
      )}
      {view === 'records' && (
        <RecordsPage
          sessions={sessions}
          modes={modes}
          onBack={goBack}
          onOpenReview={(id) => void openReview(id)}
        />
      )}
      {view === 'settings' && (
        <SettingsPage
          settings={settings}
          modes={modes}
          onChange={handleSettingsChange}
          onRemoveFeedbackItem={handleRemoveFeedbackItem}
        />
      )}
    </Layout>
  )
}
