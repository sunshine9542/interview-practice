import { SessionList } from '../components/SessionList'
import type { ModeInfo } from '../data/modes'
import type { PracticeSession } from '../types'

interface Props {
  sessions: PracticeSession[]
  modes: ModeInfo[]
  onBack: () => void
  onOpenReview: (id: string) => void
}

export function RecordsPage({ sessions, modes, onBack, onOpenReview }: Props) {
  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← 뒤로
        </button>
      </header>
      <h1 className="page-title">전체 기록</h1>
      <p className="page-sub">총 {sessions.length}개의 연습 기록</p>
      <SessionList sessions={sessions} modes={modes} onOpen={onOpenReview} />
    </>
  )
}
