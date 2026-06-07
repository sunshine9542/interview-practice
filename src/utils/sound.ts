let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

export function playCue(type: 'ding' | 'click'): void {
  const ctx = getCtx()
  const t = ctx.currentTime

  if (type === 'ding') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.08)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.35, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.5)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1320, t + 0.06)
    gain2.gain.setValueAtTime(0, t + 0.06)
    gain2.gain.linearRampToValueAtTime(0.12, t + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t + 0.06)
    osc2.stop(t + 0.4)
  } else {
    const bufferSize = ctx.sampleRate * 0.03
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15))
    }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1200
    src.buffer = buffer
    gain.gain.value = 0.5
    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    src.start(t)
    src.stop(t + 0.05)
  }
}

export function unlockAudio(): void {
  try {
    getCtx()
  } catch {
    /* ignore */
  }
}
