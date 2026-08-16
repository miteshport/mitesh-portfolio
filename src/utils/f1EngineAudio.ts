// Procedural Web Audio API F1 V6 Turbo-Hybrid & Sonic Light Synthesizer
let audioCtx: AudioContext | null = null;
let oscFundamental: OscillatorNode | null = null;
let oscHarmonic2: OscillatorNode | null = null;
let oscHarmonic3: OscillatorNode | null = null;
let oscTurbo: OscillatorNode | null = null;
let noiseNode: AudioBufferSourceNode | null = null;

let masterGain: GainNode | null = null;
let engineGain: GainNode | null = null;
let turboGain: GainNode | null = null;
let noiseGain: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;

let isInitialized = false;

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
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

    // Master Engine Lowpass Filter
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(3400, audioCtx.currentTime);
    filterNode.Q.setValueAtTime(2.2, audioCtx.currentTime);
    filterNode.connect(masterGain);

    // 1. Fundamental Engine Oscillator (Low-frequency piston rumble)
    oscFundamental = audioCtx.createOscillator();
    oscFundamental.type = "sawtooth";
    oscFundamental.frequency.setValueAtTime(105, audioCtx.currentTime);

    // 2. 2nd Harmonic (V6 exhaust roar)
    oscHarmonic2 = audioCtx.createOscillator();
    oscHarmonic2.type = "triangle";
    oscHarmonic2.frequency.setValueAtTime(210, audioCtx.currentTime);

    // 3. 3rd Harmonic (High-RPM mechanical scream)
    oscHarmonic3 = audioCtx.createOscillator();
    oscHarmonic3.type = "sawtooth";
    oscHarmonic3.frequency.setValueAtTime(315, audioCtx.currentTime);

    engineGain = audioCtx.createGain();
    engineGain.gain.setValueAtTime(0.12, audioCtx.currentTime);

    oscFundamental.connect(engineGain);
    oscHarmonic2.connect(engineGain);
    oscHarmonic3.connect(engineGain);
    engineGain.connect(filterNode);

    // 4. Turbocharger Whistle (Pure high-frequency sine)
    oscTurbo = audioCtx.createOscillator();
    oscTurbo.type = "sine";
    oscTurbo.frequency.setValueAtTime(1900, audioCtx.currentTime);

    turboGain = audioCtx.createGain();
    turboGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    oscTurbo.connect(turboGain);
    turboGain.connect(masterGain);

    // 5. Exhaust Wind Roar
    const noiseBuffer = createNoiseBuffer(audioCtx);
    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(750, audioCtx.currentTime);
    noiseFilter.Q.setValueAtTime(1.4, audioCtx.currentTime);

    noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.035, audioCtx.currentTime);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filterNode);

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
  isMuted: boolean
) {
  if (!audioCtx || !isInitialized) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (isMuted) {
    masterGain?.gain.setTargetAtTime(0.0, now, 0.05);
    return;
  }

  // Master Volume based on speed
  const targetMasterVol = isBoosting ? 0.24 : 0.15;
  masterGain?.gain.setTargetAtTime(targetMasterVol, now, 0.08);

  // Map RPM (10,500 - 15,000) to fundamental frequencies (75Hz - 195Hz)
  const baseFreq = 72 + ((rpm - 10000) / 5000) * 118;
  oscFundamental?.frequency.setTargetAtTime(baseFreq, now, 0.04);
  oscHarmonic2?.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.04);
  oscHarmonic3?.frequency.setTargetAtTime(baseFreq * 3.5, now, 0.04);

  // Turbo Spool Whistle on boost
  const turboFreq = 1800 + ((rpm - 10000) / 5000) * 1800;
  oscTurbo?.frequency.setTargetAtTime(turboFreq, now, 0.05);
  const targetTurboVol = isBoosting ? 0.05 : 0.005;
  turboGain?.gain.setTargetAtTime(targetTurboVol, now, 0.06);

  // Filter sweep with speed
  const filterCutoff = 2200 + (speed / 365) * 3800;
  filterNode?.frequency.setTargetAtTime(filterCutoff, now, 0.05);
}

// ✨ CRYSTALLINE SONIC PULSE (When slicing through Sonic Laser Rings)
export function playSonicPulse() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  // Dual Harmonic Chime (Pure Glass Resonance)
  const freqs = [880, 1318.51, 1760]; // A5, E6, A6

  freqs.forEach((freq, idx) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    gain.gain.setValueAtTime(0.0, now + idx * 0.04);
    gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.45);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.5);
  });
}

// 💥 SUBSONIC RUMBLE ON KERB CONTACT
export function playKerbRumble() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(65, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 0.2);

  gain.gain.setValueAtTime(0.16, now);
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
