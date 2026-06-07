import type { BuiltinModeId, CustomMode, PracticeModeId } from '../types'

const BUILTIN_QUESTIONS: Record<BuiltinModeId, string[]> = {
  career: [
    '자기소개를 2분 안에 해 주세요.',
    '우리 회사에 지원한 이유는 무엇인가요?',
    '가장 어려웠던 프로젝트와 그때의 역할을 말해 주세요.',
    '팀에서 갈등이 있었을 때 어떻게 해결했나요?',
    '본인의 강점과 약점을 각각 설명해 주세요.',
    '5년 후 어떤 모습이 되고 싶은가요?',
    '이 직무에 적합하다고 생각하는 이유는?',
    '실패 경험과 그로부터 배운 점을 말해 주세요.',
  ],
  customer: [
    '고객이 환불을 요구하며 화를 내고 있습니다. 어떻게 응대하시겠습니까?',
    '배송이 일주일 지연됐다는 문의입니다. 첫 응대 멘트를 말해 주세요.',
    '제품 불량 신고에 대해 공감부터 해결까지 순서대로 말해 주세요.',
    '정책상 불가한 요청을 정중히 거절하는 방법을 설명해 주세요.',
    '동일한 민원이 반복될 때 어떻게 대응하시겠습니까?',
  ],
  media: [
    '이번 활동의 핵심 메시지를 30초 안에 전달해 주세요.',
    '논란이 된 부분에 대한 입장을 짧게 말해 주세요.',
    '시청자에게 가장 전하고 싶은 한 가지는 무엇인가요?',
    '앞으로의 계획을 한 문장으로 요약해 주세요.',
  ],
  presentation: [
    '발표의 핵심 결론을 1분 안에 말해 주세요.',
    '예산이 부족할 때 어떻게 우선순위를 정하셨나요?',
    '청중이 이해하기 쉽게 설명한다면 어떻게 하시겠습니까?',
    'Q&A에서 예상 질문 하나에 답해 주세요.',
  ],
  english: [
    'Please introduce yourself in two minutes.',
    'Why are you interested in this role?',
    'Describe a challenge you overcame at work.',
    'What is your greatest strength and weakness?',
    'Where do you see yourself in five years?',
  ],
}

let _customModes: CustomMode[] = []

export function setCustomModes(modes: CustomMode[]) {
  _customModes = modes
}

function getPool(modeId: PracticeModeId): string[] {
  if (modeId in BUILTIN_QUESTIONS) {
    return BUILTIN_QUESTIONS[modeId as BuiltinModeId]
  }
  const custom = _customModes.find((m) => m.id === modeId)
  return custom?.questions ?? []
}

export function pickRandomQuestion(modeId: PracticeModeId): string {
  const list = getPool(modeId)
  if (list.length === 0) return '질문이 없습니다.'
  return list[Math.floor(Math.random() * list.length)]
}

export function pickMultipleQuestions(modeId: PracticeModeId, count: number): string[] {
  const source = getPool(modeId)
  if (source.length === 0) return ['질문이 없습니다.']
  const result: string[] = []
  let pool = [...source]
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool = [...source]
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}
