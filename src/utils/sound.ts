let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

function connectSoftChain(ctx: AudioContext, t: number) {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.55, t)

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.setValueAtTime(2400, t)
  lowpass.Q.setValueAtTime(0.6, t)

  lowpass.connect(master)
  master.connect(ctx.destination)
  return lowpass
}

function playTone(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  {
    volume = 0.1,
    attack = 0.04,
    decay = 0.35,
    type = 'sine' as OscillatorType,
    detune = 0,
  }: {
    volume?: number
    attack?: number
    decay?: number
    type?: OscillatorType
    detune?: number
  } = {},
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  osc.detune.setValueAtTime(detune, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(t)
  osc.stop(t + attack + decay + 0.05)
}

/** 질문 표시용 — 부드러운 차임 */
function playSoftDing(ctx: AudioContext, t: number) {
  const dest = connectSoftChain(ctx, t)

  playTone(ctx, dest, t, 587.33, { volume: 0.09, attack: 0.06, decay: 0.55, detune: -4 })
  playTone(ctx, dest, t + 0.03, 880, { volume: 0.045, attack: 0.08, decay: 0.45, detune: 2 })
  playTone(ctx, dest, t + 0.07, 1174.66, { volume: 0.025, attack: 0.1, decay: 0.35, type: 'triangle' })
}

/** 카운트다운용 — 가벼운 틱 */
function playSoftClick(ctx: AudioContext, t: number) {
  const dest = connectSoftChain(ctx, t)

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(640, t)
  osc.frequency.exponentialRampToValueAtTime(480, t + 0.06)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(t)
  osc.stop(t + 0.12)

  playTone(ctx, dest, t + 0.01, 1046.5, { volume: 0.018, attack: 0.008, decay: 0.06, type: 'triangle' })
}

export function playCue(type: 'ding' | 'click'): void {
  const ctx = getCtx()
  const t = ctx.currentTime + 0.01

  if (type === 'ding') {
    playSoftDing(ctx, t)
  } else {
    playSoftClick(ctx, t)
  }
}

export function unlockAudio(): void {
  try {
    getCtx()
  } catch {
    /* ignore */
  }
}
