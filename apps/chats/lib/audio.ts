/**
 * SOMION HQ - AUDIO
 *
 * Two jobs:
 *
 *  1. PROXIMITY. A real Web Audio graph - PannerNode plus GainNode per person -
 *     so walking toward someone genuinely makes them louder and pans them to
 *     the correct ear. This is the demo's first "wow" and it is not faked.
 *     In production the same graph drives LiveKit tracks instead of samples;
 *     everything below the `attach` boundary is what gets replaced.
 *
 *  2. THE FOUR SOUNDS. Knock, join, leave, mention. The design plan allows
 *     exactly four, each under 400ms, behind a single toggle. They are
 *     synthesised rather than shipped as files: soft sine tones with a short
 *     exponential decay read as gentle rather than as notification spam, and
 *     nothing has to be downloaded before the demo will run.
 *
 * A browser will not start an AudioContext before a user gesture, so the
 * context is created lazily on the first interaction and every call is a no-op
 * until then. That is by design, not a bug.
 */

export type Sound = "knock" | "join" | "leave" | "mention";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

/** Lazily create the graph. Safe to call from anywhere, any number of times. */
function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

/** Whether the audio graph is actually running. "suspended" is the state a
    browser leaves it in until a gesture, which the dock reports honestly. */
export function audioState(): "running" | "suspended" | "closed" | "interrupted" | "none" {
  return ctx ? ctx.state : "none";
}

export function resumeAudio(): void {
  const c = ensureContext();
  if (c && c.state === "suspended") void c.resume();
}

export function setAudioEnabled(on: boolean): void {
  enabled = on;
  if (master) master.gain.value = on ? 0.5 : 0;
}

export function isAudioEnabled(): boolean {
  return enabled;
}

/* ------------------------------------------------------------ the 4 sounds */

interface Tone {
  freq: number;
  /** Seconds. Every sound stays under 0.4s. */
  duration: number;
  type: OscillatorType;
  gain: number;
  /** Optional second note, delayed, for a two-note figure. */
  second?: { freq: number; delay: number };
}

const TONES: Record<Sound, Tone> = {
  /* Two soft rising notes: a question, not an alarm. */
  knock: { freq: 528, duration: 0.22, type: "sine", gain: 0.22, second: { freq: 704, delay: 0.11 } },
  /* A gentle low-to-high arrival. */
  join: { freq: 396, duration: 0.18, type: "sine", gain: 0.16, second: { freq: 594, delay: 0.09 } },
  /* The reverse of join, quieter. Leaving should be less eventful than arriving. */
  leave: { freq: 594, duration: 0.16, type: "sine", gain: 0.12, second: { freq: 396, delay: 0.08 } },
  /* One clear note. Mentions are the only thing that interrupts by default. */
  mention: { freq: 880, duration: 0.16, type: "triangle", gain: 0.14 },
};

function playTone(freq: number, at: number, duration: number, type: OscillatorType, gain: number): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  /* Exponential decay, never a hard stop: a click at the end is what makes
     interface sounds feel cheap. */
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(env);
  env.connect(master);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

export function playSound(sound: Sound): void {
  if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const tone = TONES[sound];
  const now = c.currentTime;
  playTone(tone.freq, now, tone.duration, tone.type, tone.gain);
  if (tone.second) {
    playTone(tone.second.freq, now + tone.second.delay, tone.duration, tone.type, tone.gain * 0.8);
  }
}

/* --------------------------------------------------------------- proximity */

interface Voice {
  source: AudioBufferSourceNode;
  panner: PannerNode;
  gain: GainNode;
}

const voices = new Map<string, Voice>();

/**
 * A short looping vowel-ish tone standing in for a person's voice. In
 * production this buffer is replaced by the LiveKit MediaStreamTrack; the
 * panner and gain graph around it is unchanged, which is the point.
 */
function makeVoiceBuffer(c: AudioContext, seedHz: number): AudioBuffer {
  const seconds = 2.4;
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / c.sampleRate;
    /* Two formants plus a slow amplitude wobble reads as speech-like without
       sounding like a musical note held down. */
    const wobble = 0.55 + 0.45 * Math.sin(2 * Math.PI * 1.7 * t);
    const syllable = Math.max(0, Math.sin(2 * Math.PI * 2.3 * t)) ** 0.6;
    data[i] =
      0.5 *
      syllable *
      wobble *
      (Math.sin(2 * Math.PI * seedHz * t) * 0.6 +
        Math.sin(2 * Math.PI * seedHz * 2.1 * t) * 0.25 +
        Math.sin(2 * Math.PI * seedHz * 3.4 * t) * 0.1);
  }
  return buf;
}

/* ------------------------------------------------------------ earshot ---- */

/** Reference distance in floor units: inside it a voice is at full level. */
export const EARSHOT_REF: Record<"near" | "normal" | "wide", number> = { near: 6, normal: 8, wide: 12 };
/** The distance the floor draws a conversation bubble at, per setting. */
export const EARSHOT_BUBBLE: Record<"near" | "normal" | "wide", number> = { near: 8, normal: 11, wide: 16 };
let earshotRef = EARSHOT_REF.normal;

export function setEarshot(setting: "near" | "normal" | "wide"): void {
  earshotRef = EARSHOT_REF[setting];
  voices.forEach((v) => {
    v.panner.refDistance = earshotRef;
  });
}

/* ------------------------------------------------------------- hearing ---- */

/* Every voice passes through one bus before the master, so deafening is a
   single gain rather than a walk over every voice. */
let hearing: GainNode | null = null;
let deafened = false;
function hearingBus(c: AudioContext): GainNode {
  if (!hearing) {
    hearing = c.createGain();
    hearing.gain.value = deafened ? 0 : 1;
    if (master) hearing.connect(master);
  }
  return hearing;
}

/** Stop hearing everyone. The voices keep playing silently, so undeafening is instant. */
export function setDeafened(on: boolean): void {
  deafened = on;
  if (hearing && ctx) hearing.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.03);
}

/* Per-person volume, 0 to 2, and per-person mute. Both are the listener's own
   choice about what they hear; a moderator's mute lives in presence. */
const volumes = new Map<string, number>();
const BASE_GAIN = 0.6;

export function setVoiceVolume(userId: string, factor: number): void {
  volumes.set(userId, factor);
  const v = voices.get(userId);
  if (v && ctx) v.gain.gain.setTargetAtTime(BASE_GAIN * factor, ctx.currentTime, 0.03);
}

/** Start a person's voice in the spatial graph. */
export function attachVoice(userId: string, seedHz = 160): void {
  if (!enabled) return;
  const c = ensureContext();
  if (!c || voices.has(userId)) return;
  if (c.state === "suspended") void c.resume();

  const source = c.createBufferSource();
  source.buffer = makeVoiceBuffer(c, seedHz);
  source.loop = true;

  const panner = c.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = earshotRef;
  panner.maxDistance = 60;
  panner.rolloffFactor = 1.6;

  const gain = c.createGain();
  gain.gain.value = BASE_GAIN * (volumes.get(userId) ?? 1);

  source.connect(panner);
  panner.connect(gain);
  gain.connect(hearingBus(c));
  source.start();

  voices.set(userId, { source, panner, gain });
}

export function detachVoice(userId: string): void {
  const v = voices.get(userId);
  if (!v) return;
  try {
    v.source.stop();
  } catch {
    /* already stopped */
  }
  v.source.disconnect();
  v.panner.disconnect();
  v.gain.disconnect();
  voices.delete(userId);
}

export function detachAllVoices(): void {
  for (const id of Array.from(voices.keys())) detachVoice(id);
}

/**
 * Place a voice relative to the listener. Coordinates are floor units (0-100);
 * they are scaled so that crossing the floor is an audible journey rather than
 * an on/off switch.
 */
export function positionVoice(
  userId: string,
  speaker: { x: number; y: number },
  listener: { x: number; y: number },
): void {
  const v = voices.get(userId);
  if (!v || !ctx) return;
  const dx = speaker.x - listener.x;
  const dy = speaker.y - listener.y;
  const now = ctx.currentTime;
  /* setTargetAtTime rather than an assignment: a jump in gain is a click. */
  if (v.panner.positionX) {
    v.panner.positionX.setTargetAtTime(dx, now, 0.08);
    v.panner.positionY.setTargetAtTime(0, now, 0.08);
    v.panner.positionZ.setTargetAtTime(dy, now, 0.08);
  } else {
    /* Safari still ships the deprecated signature. */
    v.panner.setPosition(dx, 0, dy);
  }
}

/** Move the listener. Called when the signed-in person walks. */
export function positionListener(at: { x: number; y: number }): void {
  const c = ensureContext();
  if (!c) return;
  const l = c.listener;
  if (l.positionX) {
    const now = c.currentTime;
    l.positionX.setTargetAtTime(0, now, 0.08);
    l.positionY.setTargetAtTime(0, now, 0.08);
    l.positionZ.setTargetAtTime(0, now, 0.08);
  } else {
    l.setPosition(0, 0, 0);
  }
  void at;
}

/** How loud a speaker is from here, 0 to 1. Drives the on-screen meter. */
export function proximityLevel(
  speaker: { x: number; y: number },
  listener: { x: number; y: number },
): number {
  const d = Math.hypot(speaker.x - listener.x, speaker.y - listener.y);
  const ref = earshotRef;
  const max = 55;
  if (d >= max) return 0;
  return Math.min(1, ref / Math.max(ref, d));
}
