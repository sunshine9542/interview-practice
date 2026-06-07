/** CSS 가로 모드(폰 베젤)가 적용되는 최소 너비와 동일 */
export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 719px)').matches
}
