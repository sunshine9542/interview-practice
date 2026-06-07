import type { CustomMode, PracticeModeId } from '../types'
import type { IconName } from '../components/Icon'

export interface ModeInfo {
  id: PracticeModeId
  label: string
  description: string
  icon: IconName
}

export const BUILTIN_MODES: ModeInfo[] = [
  { id: 'career', label: '커리어 · 입사', description: '입사 · 이직 · 승진 면접', icon: 'briefcase' },
  { id: 'customer', label: '고객 응대', description: '민원 · 불만 · 문의 대응', icon: 'headset' },
  { id: 'media', label: '미디어 · 인터뷰', description: '기자 · 유튜브 · 팟캐스트', icon: 'mic' },
  { id: 'presentation', label: '발표 · PT', description: '피칭 · Q&A', icon: 'presentation' },
  { id: 'english', label: '영어 인터뷰', description: 'English practice', icon: 'globe' },
]

export function getAllModes(customModes: CustomMode[]): ModeInfo[] {
  return [
    ...BUILTIN_MODES,
    ...customModes.map((c) => ({
      id: c.id,
      label: c.label,
      description: `질문 ${c.questions.length}개`,
      icon: 'custom' as IconName,
    })),
  ]
}

/** @deprecated use getAllModes */
export const MODES = BUILTIN_MODES
