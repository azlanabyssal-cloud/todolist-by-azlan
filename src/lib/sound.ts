let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function isSoundEnabled(): boolean {
  return localStorage.getItem('soundEnabled') !== 'false'
}

export function playComplete() {
  if (!isSoundEnabled()) return
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, ac.currentTime)        // C5
    osc.frequency.setValueAtTime(659, ac.currentTime + 0.08) // E5
    osc.frequency.setValueAtTime(784, ac.currentTime + 0.16) // G5

    gain.gain.setValueAtTime(0.18, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45)

    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.45)
  } catch {
    // AudioContext blocked — silently ignore
  }
}

export function playUndo() {
  if (!isSoundEnabled()) return
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(392, ac.currentTime)        // G4
    osc.frequency.setValueAtTime(330, ac.currentTime + 0.1)  // E4

    gain.gain.setValueAtTime(0.1, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3)

    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.3)
  } catch {
    //
  }
}
