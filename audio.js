/**
 * audio.js — Web Audio API sound effects
 */

let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playRocket() {
  try {
    const ctx = getAudio();
    const now = ctx.currentTime;
    const dur = 4.0;

    // Layer 1: Deep low-frequency rumble
    const rumbleBuf = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = rumbleBuf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const t = i / ctx.sampleRate;
        d[i] = (
          (Math.random() * 2 - 1) * 0.7 +
          Math.sin(2 * Math.PI * 40  * t) * 0.3 +
          Math.sin(2 * Math.PI * 65  * t) * 0.2 +
          Math.sin(2 * Math.PI * 120 * t) * 0.1
        ) * Math.min(1, t * 3) * (1 - (t / dur) * 0.3);
      }
    }
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = rumbleBuf;
    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.setValueAtTime(180, now);
    lp1.frequency.linearRampToValueAtTime(80, now + dur);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.55, now + 0.15);
    g1.gain.setValueAtTime(0.55, now + 2.5);
    g1.gain.linearRampToValueAtTime(0.001, now + dur);
    rumbleSrc.connect(lp1); lp1.connect(g1); g1.connect(ctx.destination);
    rumbleSrc.start(now);

    // Layer 2: Mid-range crackling thrust
    const thrustBuf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const td = thrustBuf.getChannelData(0);
    for (let i = 0; i < td.length; i++) {
      td[i] = (Math.random() * 2 - 1) * Math.pow(Math.max(0, 1 - (i / td.length) * 0.4), 0.5);
    }
    const tSrc = ctx.createBufferSource();
    tSrc.buffer = thrustBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(380, now);
    bp.frequency.exponentialRampToValueAtTime(120, now + dur);
    bp.Q.value = 1.2;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.35, now + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.001, now + dur);
    tSrc.connect(bp); bp.connect(g2); g2.connect(ctx.destination);
    tSrc.start(now);

    // Layer 3: High-freq hiss (exhaust)
    const hissOsc = ctx.createOscillator();
    hissOsc.type = 'sawtooth';
    hissOsc.frequency.setValueAtTime(280, now);
    hissOsc.frequency.exponentialRampToValueAtTime(55, now + 3.5);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 220;
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0, now);
    g3.gain.linearRampToValueAtTime(0.14, now + 0.08);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    hissOsc.connect(hp); hp.connect(g3); g3.connect(ctx.destination);
    hissOsc.start(now); hissOsc.stop(now + 3.5);

    // Layer 4: Ignition bang
    const bangBuf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const bd = bangBuf.getChannelData(0);
    for (let i = 0; i < bd.length; i++) {
      bd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }
    const bangSrc = ctx.createBufferSource();
    bangSrc.buffer = bangBuf;
    const bangLp = ctx.createBiquadFilter();
    bangLp.type = 'lowpass';
    bangLp.frequency.value = 300;
    const g4 = ctx.createGain();
    g4.gain.setValueAtTime(0.8, now);
    g4.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    bangSrc.connect(bangLp); bangLp.connect(g4); g4.connect(ctx.destination);
    bangSrc.start(now);

    // Layer 5: Doppler shift
    const dopOsc = ctx.createOscillator();
    dopOsc.type = 'sawtooth';
    dopOsc.frequency.setValueAtTime(160, now + 0.3);
    dopOsc.frequency.exponentialRampToValueAtTime(28, now + dur);
    const dopG = ctx.createGain();
    dopG.gain.setValueAtTime(0, now + 0.3);
    dopG.gain.linearRampToValueAtTime(0.2, now + 0.6);
    dopG.gain.exponentialRampToValueAtTime(0.001, now + dur);
    const dopLp = ctx.createBiquadFilter();
    dopLp.type = 'lowpass';
    dopLp.frequency.value = 350;
    dopOsc.connect(dopLp); dopLp.connect(dopG); dopG.connect(ctx.destination);
    dopOsc.start(now + 0.3); dopOsc.stop(now + dur);
  } catch (e) {}
}

function playGlow() {
  try {
    const ctx = getAudio();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.1, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.35);
  } catch (e) {}
}

function playChime(freq, delay = 0) {
  try {
    const ctx = getAudio();
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.8);
  } catch (e) {}
}
