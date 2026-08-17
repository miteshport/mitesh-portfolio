// Procedural Web Audio API Cinematic Engine Synthesizer with Convolution Reverb & Sub-Bass
let audioCtx: AudioContext | null = null;
let oscSub: OscillatorNode | null = null;
let oscFundamental: OscillatorNode | null = null;
let oscHarmonic2: OscillatorNode | null = null;
let oscHarmonic3: OscillatorNode | null = null;
let oscTurbo: OscillatorNode | null = null;
let noiseNode: AudioBufferSourceNode | null = null;

let masterGain: GainNode | null = null;
let engineGain: GainNode | null = null;
let subGain: GainNode | null = null;
let turboGain: GainNode | null = null;
let noiseGain: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let convolverNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;

let isInitialized = false;
let lastGear = 1;

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Generate a synthetic Gotham tunnel impulse response (dense metallic/concrete decay)
function createImpulseResponse(ctx: AudioContext, duration = 1.4, decay = 2.8): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * duration);
  const impulse = ctx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    const env = Math.pow(1 - t, decay);
    // Early reflections + late diffuse tail
    const early = i < 800 ? (Math.random() * 2 - 1) * 0.8 : 0;
    const diffuse = (Math.random() * 2 - 1) * env;
    left[i] = (diffuse + early) * 0.5;
    right[i] = (diffuse - early) * 0.5;
  }
  return impulse;
}

export function initF1Engine() {
  if (isInitialized || typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // Convolver Reverb (Tunnel Space)
    try {
      convolverNode = audioCtx.createConvolver();
      convolverNode.buffer = createImpulseResponse(audioCtx, 1.2, 3.0);

      reverbGain = audioCtx.createGain();
      reverbGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

      convolverNode.connect(reverbGain);
      reverbGain.connect(masterGain);
    } catch {
      convolverNode = null;
    }

    // Master Engine Lowpass Filter
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(3200, audioCtx.currentTime);
    filterNode.Q.setValueAtTime(1.8, audioCtx.currentTime);
    filterNode.connect(masterGain);

    if (convolverNode) {
      filterNode.connect(convolverNode);
    }

    // 0. Sub-Bass Rumble (Chest-thumping 42Hz low-end)
    oscSub = audioCtx.createOscillator();
    oscSub.type = "sine";
    oscSub.frequency.setValueAtTime(45, audioCtx.currentTime);

    subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(0.22, audioCtx.currentTime);
    oscSub.connect(subGain);
    subGain.connect(masterGain);

    // 1. Fundamental Engine Oscillator (Piston rumble)
    oscFundamental = audioCtx.createOscillator();
    oscFundamental.type = "sawtooth";
    oscFundamental.frequency.setValueAtTime(85, audioCtx.currentTime);

    // 2. 2nd Harmonic (V6/V8 roar)
    oscHarmonic2 = audioCtx.createOscillator();
    oscHarmonic2.type = "triangle";
    oscHarmonic2.frequency.setValueAtTime(170, audioCtx.currentTime);

    // 3. 3rd Harmonic (Exhaust rasp)
    oscHarmonic3 = audioCtx.createOscillator();
    oscHarmonic3.type = "sawtooth";
    oscHarmonic3.frequency.setValueAtTime(255, audioCtx.currentTime);

    engineGain = audioCtx.createGain();
    engineGain.gain.setValueAtTime(0.16, audioCtx.currentTime);

    oscFundamental.connect(engineGain);
    oscHarmonic2.connect(engineGain);
    oscHarmonic3.connect(engineGain);
    engineGain.connect(filterNode);

    // 4. Turbocharger Whistle (High sine)
    oscTurbo = audioCtx.createOscillator();
    oscTurbo.type = "sine";
    oscTurbo.frequency.setValueAtTime(1600, audioCtx.currentTime);

    turboGain = audioCtx.createGain();
    turboGain.gain.setValueAtTime(0.005, audioCtx.currentTime);
    oscTurbo.connect(turboGain);
    turboGain.connect(filterNode);

    // 5. Exhaust Wind Roar
    const noiseBuffer = createNoiseBuffer(audioCtx);
    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(650, audioCtx.currentTime);
    noiseFilter.Q.setValueAtTime(1.2, audioCtx.currentTime);

    noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filterNode);

    oscSub.start();
    oscFundamental.start();
    oscHarmonic2.start();
    oscHarmonic3.start();
    oscTurbo.start();
    noiseNode.start();

    isInitialized = true;
  } catch (err) {
    console.warn("Cinematic Engine Audio could not initialize:", err);
  }
}

export function updateF1Engine(
  rpm: number,
  speed: number,
  isBoosting: boolean,
  isMuted: boolean,
  gear: number = 1
) {
  if (!audioCtx || !isInitialized) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (isMuted) {
    masterGain?.gain.setTargetAtTime(0.0, now, 0.03);
    return;
  }

  // Master Volume based on speed & boost
  const targetMasterVol = isBoosting ? 0.28 : 0.19;
  masterGain?.gain.setTargetAtTime(targetMasterVol, now, 0.08);

  // Sub-Bass mapping (40Hz - 75Hz)
  const subFreq = 42 + ((rpm - 10000) / 5000) * 32;
  oscSub?.frequency.setTargetAtTime(subFreq, now, 0.04);
  subGain?.gain.setTargetAtTime(isBoosting ? 0.32 : 0.22, now, 0.06);

  // Fundamental frequencies (65Hz - 165Hz)
  const baseFreq = 62 + ((rpm - 10000) / 5000) * 98;
  oscFundamental?.frequency.setTargetAtTime(baseFreq, now, 0.04);
  oscHarmonic2?.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.04);
  oscHarmonic3?.frequency.setTargetAtTime(baseFreq * 3.2, now, 0.04);

  // Turbo Spool Whistle on boost
  const turboFreq = 1600 + ((rpm - 10000) / 5000) * 1400;
  oscTurbo?.frequency.setTargetAtTime(turboFreq, now, 0.05);
  const targetTurboVol = isBoosting ? 0.045 : 0.008;
  turboGain?.gain.setTargetAtTime(targetTurboVol, now, 0.06);

  // Filter sweep with speed
  const filterCutoff = 1800 + (speed / 365) * 3200;
  filterNode?.frequency.setTargetAtTime(filterCutoff, now, 0.05);

  // Gear Shift Acoustic Transient
  if (gear !== lastGear && Math.abs(speed) > 30) {
    lastGear = gear;
    playGearShiftClick(now);
  }
}

function playGearShiftClick(time: number) {
  if (!audioCtx || !filterNode) return;
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.06);
    g.gain.setValueAtTime(0.18, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    osc.connect(g);
    g.connect(filterNode);
    osc.start(time);
    osc.stop(time + 0.08);
  } catch {
    // ignore
  }
}

// ✨ CRYSTALLINE SECTOR TIMING PULSE
export function playSonicPulse(isMuted: boolean = false) {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;
  const freqs = [880, 1318.51, 1760];

  freqs.forEach((freq, idx) => {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    gain.gain.setValueAtTime(0.0, now + idx * 0.04);
    gain.gain.linearRampToValueAtTime(0.10, now + idx * 0.04 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.42);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.45);
  });
}

// 💥 SUBSONIC RUMBLE ON KERB CONTACT
export function playKerbRumble(isMuted: boolean = false) {
  if (isMuted || !audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(60, now);
  osc.frequency.exponentialRampToValueAtTime(26, now + 0.2);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.24);
}

export function stopF1Engine() {
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.05);
  }
}
