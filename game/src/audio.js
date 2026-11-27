// Gobble Dash — audio: all sounds are synthesized with WebAudio, no audio files.
// The context is created lazily on the first user gesture (browsers require that).
export function makeAudio() {
  let ctx = null;
  let muted = false;
  let ovenHum = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, lowpass) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const gain = c.createGain();
    gain.gain.value = vol || 0.15;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }

  return {
    unlock() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopOven();
      return muted;
    },
    isMuted() {
      return muted;
    },
    step() {
      noise(0.05, 0.05, 500);
    },
    jump() {
      tone(320, 0.18, 'sine', 0.1, 640);
    },
    whoosh() {
      noise(0.22, 0.16, 2400);
    },
    gobble() {
      // three quick descending clucks, the turkey's signature
      tone(520, 0.07, 'square', 0.09, 380);
      setTimeout(() => tone(470, 0.07, 'square', 0.09, 340), 80);
      setTimeout(() => tone(600, 0.12, 'square', 0.1, 300), 170);
    },
    pickup(combo) {
      const base = 660 + Math.min(combo, 5) * 60;
      tone(base, 0.1, 'triangle', 0.14, base * 1.4);
    },
    feather() {
      tone(880, 0.12, 'sine', 0.12, 1320);
      setTimeout(() => tone(1174, 0.16, 'sine', 0.1, 1560), 90);
    },
    hit() {
      tone(180, 0.3, 'sawtooth', 0.16, 60);
      noise(0.2, 0.2, 900);
    },
    farmerShout() {
      tone(140, 0.35, 'sawtooth', 0.14, 90);
      setTimeout(() => tone(110, 0.3, 'sawtooth', 0.12, 70), 120);
    },
    knife() {
      noise(0.3, 0.12, 4000);
    },
    startOven() {
      if (muted || ovenHum) return;
      const c = ensure();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      gain.gain.value = 0.03;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;
      osc.connect(filter).connect(gain).connect(c.destination);
      osc.start();
      ovenHum = { osc, gain };
    },
    stopOven() {
      if (!ovenHum) return;
      try {
        ovenHum.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        ovenHum.osc.stop(ctx.currentTime + 0.1);
      } catch {
        // already stopped
      }
      ovenHum = null;
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.14), i * 130));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.1), i * 160));
    },
  };
}
