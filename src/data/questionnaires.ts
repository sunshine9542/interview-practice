import type { PracticeModeId, QuestionnaireItem } from '../types'

const TEMPLATES: Record<PracticeModeId, QuestionnaireItem[]> = {
  career: [
    { id: 'conclusion_first', label: '결론을 먼저 말했나요?', type: 'yesno' },
    { id: 'within_time', label: '2분 안에 답을 마쳤나요?', type: 'yesno' },
    { id: 'star_structure', label: 'STAR 구조가 보이나요?', type: 'yesno' },
    { id: 'clarity', label: '논리·명확성', type: 'scale' },
    { id: 'confidence', label: '자신감·태도', type: 'scale' },
    { id: 'filler', label: '필러어(음, 어) 빈도', type: 'scale' },
    { id: 'eye_contact', label: '시선·표정 안정', type: 'scale' },
    { id: 'pace', label: '말하기 속도 적절', type: 'scale' },
  ],
  customer: [
    { id: 'empathy', label: '공감 표현이 있었나요?', type: 'yesno' },
    { id: 'fact_check', label: '사실 확인 후 답했나요?', type: 'yesno' },
    { id: 'solution', label: '해결안을 제시했나요?', type: 'yesno' },
    { id: 'tone', label: '말투·침착함', type: 'scale' },
    { id: 'no_interrupt', label: '상대 말을 끊지 않았나요?', type: 'yesno' },
    { id: 'clarity', label: '메시지 명확성', type: 'scale' },
  ],
  media: [
    { id: 'core_message', label: '핵심 메시지가 있었나요?', type: 'yesno' },
    { id: 'within_30s', label: '30초 안에 요점 전달?', type: 'yesno' },
    { id: 'defensive', label: '방어적이지 않았나요?', type: 'yesno' },
    { id: 'brevity', label: '간결함', type: 'scale' },
    { id: 'energy', label: '에너지·전달력', type: 'scale' },
  ],
  presentation: [
    { id: 'opening', label: '도입이 명확했나요?', type: 'yesno' },
    { id: 'data', label: '수치·근거 언급', type: 'yesno' },
    { id: 'time', label: '시간 안에 마쳤나요?', type: 'yesno' },
    { id: 'structure', label: '구조·흐름', type: 'scale' },
    { id: 'qa_ready', label: 'Q&A 대비感', type: 'scale' },
  ],
  english: [
    { id: 'fluency', label: 'Fluency (유창성)', type: 'scale' },
    { id: 'clarity_en', label: 'Clarity (명확성)', type: 'scale' },
    { id: 'grammar', label: 'Grammar flow', type: 'scale' },
    { id: 'pace_en', label: 'Speaking pace', type: 'scale' },
    { id: 'confidence_en', label: 'Confidence', type: 'scale' },
  ],
}

const FALLBACK_MODE = 'career'

function baseTemplate(modeId: PracticeModeId): QuestionnaireItem[] {
  const list = modeId in TEMPLATES ? TEMPLATES[modeId as keyof typeof TEMPLATES] : TEMPLATES[FALLBACK_MODE]
  return list.map((item) => ({ ...item }))
}

export function getQuestionnaireTemplate(
  modeId: PracticeModeId,
  customItems: QuestionnaireItem[] = [],
): QuestionnaireItem[] {
  return [
    ...baseTemplate(modeId),
    ...customItems.map((item) => ({ ...item, custom: true })),
  ]
}

export function getCustomFeedbackItems(
  settings: { customFeedbackByMode: Partial<Record<string, QuestionnaireItem[]>> },
  modeId: PracticeModeId,
): QuestionnaireItem[] {
  return settings.customFeedbackByMode[modeId] ?? []
}
