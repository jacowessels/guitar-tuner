import { INSTRUMENTS, findTuning } from './tunings.js';
import { parseNote, midiToFreq, freqToMidi, pretty, TUNER_NAMES } from './music.js';
import { detectPitch } from './pitch.js';
import { chordsForTuning } from './chords.js';
import { chordSVG } from './diagram.js';

// ---------- persistent settings ----------
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
};

const $ = (id) => document.getElementById(id);
const els = {
  instruments: $('instruments'),
  tuning: $('tuning'),
  tuner: $('tuner'),
  note: $('note'),
  hearing: $('hearing'),
  needle: $('needle'),
  cents: $('cents'),
  hint: $('hint'),
  freq: $('freq'),
  start: $('startBtn'),
  micError: $('micError'),
  strings: $('strings'),
  autoBtn: $('autoBtn'),
  toneBtn: $('toneBtn'),
  chords: $('chords'),
  chordsTitle: $('chordsTitle'),
  tuningDesc: $('tuningDesc'),
  filters: $('filters'),
  a4: $('a4'),
  a4Val: $('a4Val'),
  a4Reset: $('a4Reset'),
  tolerance: $('tolerance'),
  settings: $('settings'),
  settingsBtn: $('settingsBtn'),
  themeBtn: $('themeBtn'),
};

const state = {
  instrument: null,
  tuning: null,
  strings: [], // [{ label, midi }]
  locked: null, // index of locked string or null
  toneMode: false,
  a4: Number(store.get('a4', 440)) || 440,
  tolerance: Number(store.get('tolerance', 5)) || 5,
  filter: 'all',
  tuned: new Set(),
};

// ---------- instrument & tuning selection ----------
function renderInstruments() {
  els.instruments.innerHTML = '';
  for (const inst of INSTRUMENTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.textContent = inst.name;
    b.setAttribute('aria-selected', String(inst === state.instrument));
    b.addEventListener('click', () => {
      if (inst === state.instrument) return;
      const saved = store.get(`tuning:${inst.id}`, inst.tunings[0].id);
      selectTuning(findTuning(saved)?.instrument === inst ? saved : inst.tunings[0].id);
    });
    els.instruments.appendChild(b);
  }
}

function renderTuningSelect() {
  els.tuning.innerHTML = '';
  for (const t of state.instrument.tunings) {
    const o = document.createElement('option');
    o.value = t.id;
    const notes = t.strings.map((s) => pretty(parseNote(s).name)).join(' ');
    o.textContent = `${t.name} — ${notes}`;
    o.selected = t === state.tuning;
    els.tuning.appendChild(o);
  }
}

function selectTuning(id) {
  const found = findTuning(id) || findTuning('standard');
  state.instrument = found.instrument;
  state.tuning = found.tuning;
  state.strings = found.tuning.strings.map((s) => {
    const p = parseNote(s);
    return { label: p.name, octave: p.octave, midi: p.midi };
  });
  state.locked = null;
  state.tuned.clear();
  store.set('tuning', found.tuning.id);
  store.set(`tuning:${found.instrument.id}`, found.tuning.id);
  renderInstruments();
  renderTuningSelect();
  renderStrings();
  renderChords();
  resetDisplay();
}

// ---------- strings ----------
function stringNumber(i) {
  // Strings are numbered from the highest-pitched (string 1) on all instruments.
  return state.strings.length - i;
}

function renderStrings() {
  els.strings.innerHTML = '';
  els.strings.style.setProperty('--n', state.strings.length);
  state.strings.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'string-btn';
    b.dataset.index = i;
    const isDrone = state.tuning.drone === i;
    b.innerHTML = `<span class="sn">${pretty(s.label)}<sub>${s.octave}</sub></span><span class="num">${
      isDrone ? '5th (short)' : `string ${stringNumber(i)}`
    }</span>`;
    b.setAttribute('aria-label', `${s.label}${s.octave}, string ${stringNumber(i)}`);
    b.addEventListener('click', () => onStringTap(i));
    els.strings.appendChild(b);
  });
  updateStringClasses();
}

function onStringTap(i) {
  if (state.toneMode) {
    playNote(midiToFreq(state.strings[i].midi, state.a4), 2.2);
    state.locked = i;
  } else {
    state.locked = state.locked === i ? null : i;
  }
  updateStringClasses();
  updateModeButtons();
}

function updateStringClasses(targetIdx = null) {
  [...els.strings.children].forEach((b, i) => {
    b.classList.toggle('locked', state.locked === i);
    b.classList.toggle('target', targetIdx === i && state.locked !== i);
    b.classList.toggle('tuned', state.tuned.has(i));
    b.setAttribute('aria-pressed', String(state.locked === i));
  });
}

function updateModeButtons() {
  const auto = state.locked === null;
  els.autoBtn.classList.toggle('active', auto);
  els.autoBtn.setAttribute('aria-pressed', String(auto));
  els.toneBtn.classList.toggle('active', state.toneMode);
  els.toneBtn.setAttribute('aria-pressed', String(state.toneMode));
}

els.autoBtn.addEventListener('click', () => {
  state.locked = null;
  updateStringClasses();
  updateModeButtons();
});
els.toneBtn.addEventListener('click', () => {
  state.toneMode = !state.toneMode;
  updateModeButtons();
});

// ---------- chord charts ----------
function renderChords() {
  const t = state.tuning;
  els.chordsTitle.textContent = `Chords for ${state.instrument.name.toLowerCase()} · ${t.name}`;
  els.tuningDesc.textContent = t.desc || '';
  const chords = chordsForTuning(t.id);
  const labels = state.strings.map((s) => pretty(s.label));
  els.chords.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const c of chords) {
    if (state.filter !== 'all' && c.cat !== state.filter) continue;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'chord-card';
    const name = pretty(c.rootName) + c.quality.replace('b5', '♭5');
    card.setAttribute('aria-label', `${name} ${c.label}. Play chord.`);
    card.innerHTML = `<div class="cn">${name}</div><div class="cl">${c.label}</div>${chordSVG(c.frets, {
      barre: c.barre,
      labels,
      drone: t.drone ?? -1,
      title: `${name} chord diagram`,
    })}`;
    card.addEventListener('click', () => strum(c.frets));
    frag.appendChild(card);
  }
  els.chords.appendChild(frag);
}

els.filters.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  state.filter = b.dataset.cat;
  [...els.filters.children].forEach((c) => c.classList.toggle('active', c === b));
  renderChords();
});

// ---------- audio output (reference tones) ----------
let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playNote(freq, duration = 2, when = 0, volume = 0.22) {
  const ac = ctx();
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(freq * 8, 6000), t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 200), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function strum(frets) {
  let k = 0;
  frets.forEach((f, i) => {
    if (f < 0) return;
    playNote(midiToFreq(state.strings[i].midi + f, state.a4), 2.4, k * 0.045, 0.12);
    k++;
  });
}

// ---------- gauge ----------
const GAUGE = { cx: 160, cy: 170, r: 140, maxAngle: 62, range: 50 };

function polar(angleDeg, r) {
  const a = (angleDeg * Math.PI) / 180;
  return [GAUGE.cx + r * Math.sin(a), GAUGE.cy - r * Math.cos(a)];
}
const centsToAngle = (c) => (Math.max(-GAUGE.range, Math.min(GAUGE.range, c)) / GAUGE.range) * GAUGE.maxAngle;

function buildGauge() {
  const ticks = $('ticks');
  let svg = '';
  for (let c = -50; c <= 50; c += 5) {
    const major = c % 10 === 0;
    const a = centsToAngle(c);
    const [x1, y1] = polar(a, GAUGE.r);
    const [x2, y2] = polar(a, GAUGE.r - (major ? 16 : 9));
    svg += `<line class="tick${major ? ' major' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    if (major && c !== 0) {
      const [lx, ly] = polar(a, GAUGE.r - 34);
      svg += `<text class="tick-lbl" x="${lx}" y="${ly + 4}" text-anchor="middle">${c > 0 ? '+' : ''}${c}</text>`;
    }
  }
  ticks.innerHTML = svg;
  updateZone();
}

function updateZone() {
  const a = centsToAngle(state.tolerance);
  const r = GAUGE.r + 10;
  const [x1, y1] = polar(-a, r);
  const [x2, y2] = polar(a, r);
  $('zone').setAttribute('d', `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`);
}

function setNeedle(cents) {
  els.needle.style.transform = `rotate(${centsToAngle(cents)}deg)`;
}

// ---------- tuner display ----------
let displayCents = 0;
let inTuneSince = 0;
let lastHeard = 0;

function setTunerClass(cls) {
  for (const c of ['idle', 'in-tune', 'close', 'off']) els.tuner.classList.toggle(c, c === cls);
}

function resetDisplay() {
  displayCents = 0;
  setNeedle(0);
  setTunerClass('idle');
  els.note.innerHTML = '–';
  els.cents.textContent = '0¢';
  els.hint.innerHTML = '&nbsp;';
  els.freq.innerHTML = '&nbsp;';
  els.hearing.textContent = running ? 'Play a string…' : 'Tap start, then play a string';
  updateStringClasses();
}

function showPitch(freq, now) {
  const midi = freqToMidi(freq, state.a4);

  // Which string are we tuning?
  let idx = state.locked;
  if (idx === null) {
    let best = Infinity;
    state.strings.forEach((s, i) => {
      const d = Math.abs(midi - s.midi);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
  }
  const target = state.strings[idx];
  const cents = (midi - target.midi) * 100;

  displayCents += (cents - displayCents) * 0.35;
  setNeedle(displayCents);

  const abs = Math.abs(cents);
  const tol = state.tolerance;
  let cls = 'off';
  let hint;
  if (abs <= tol) {
    cls = 'in-tune';
    hint = 'In tune ✓';
  } else if (abs > 100) {
    const semis = Math.round(abs / 100);
    hint = cents < 0 ? `Way too low (${semis} semitones) · tune up ↑` : `Way too high (${semis} semitones) · tune down ↓`;
  } else {
    if (abs <= 15) cls = 'close';
    hint = cents < 0 ? 'Flat · tune up ↑' : 'Sharp · tune down ↓';
  }
  setTunerClass(cls);

  els.note.innerHTML = `${pretty(target.label)}<sub>${target.octave}</sub>`;
  const shown = Math.round(cents);
  els.cents.textContent = `${shown > 0 ? '+' : ''}${shown}¢`;
  els.hint.textContent = hint;
  els.freq.textContent = `${freq.toFixed(1)} Hz · target ${midiToFreq(target.midi, state.a4).toFixed(1)} Hz`;

  const nearest = Math.round(midi);
  const heardName = TUNER_NAMES[((nearest % 12) + 12) % 12] + (Math.floor(nearest / 12) - 1);
  const heardCents = Math.round((midi - nearest) * 100);
  els.hearing.textContent = `Hearing ${pretty(heardName)} ${heardCents >= 0 ? '+' : ''}${heardCents}¢`;

  // Mark a string as tuned once it has stayed in tune briefly.
  if (cls === 'in-tune') {
    if (!inTuneSince) inTuneSince = now;
    if (now - inTuneSince > 700 && !state.tuned.has(idx)) state.tuned.add(idx);
  } else {
    inTuneSince = 0;
  }
  updateStringClasses(idx);
}

// ---------- microphone & analysis loop ----------
let running = false;
let stream = null;
let analyser = null;
let sourceNode = null;
let rafId = 0;
let wakeLock = null;
const recent = [];

async function start() {
  els.micError.hidden = true;
  if (!navigator.mediaDevices?.getUserMedia) {
    showError('This browser cannot access the microphone. Try a recent Chrome, Safari or Firefox over https.');
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (e) {
    showError(
      e.name === 'NotAllowedError'
        ? 'Microphone access was blocked. Allow the microphone for this site in your browser settings, then try again.'
        : `Could not start the microphone (${e.message || e.name}).`
    );
    return;
  }
  const ac = ctx();
  sourceNode = ac.createMediaStreamSource(stream);
  analyser = ac.createAnalyser();
  analyser.fftSize = 4096;
  sourceNode.connect(analyser);
  running = true;
  els.start.textContent = 'Stop';
  els.start.classList.add('running');
  els.hearing.textContent = 'Play a string…';
  requestWakeLock();
  loop();
}

function stop() {
  running = false;
  cancelAnimationFrame(rafId);
  stream?.getTracks().forEach((t) => t.stop());
  sourceNode?.disconnect();
  stream = analyser = sourceNode = null;
  wakeLock?.release().catch(() => {});
  wakeLock = null;
  els.start.textContent = 'Start tuner';
  els.start.classList.remove('running');
  resetDisplay();
}

function showError(msg) {
  els.micError.textContent = msg;
  els.micError.hidden = false;
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch {
    /* not critical */
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && running) requestWakeLock();
});

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[s.length >> 1];
}

function loop() {
  if (!running) return;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  const now = performance.now();
  const r = detectPitch(buf, audioCtx.sampleRate);
  if (r && r.clarity > 0.85) {
    // Start a fresh history when the note changes a lot (new string plucked).
    if (recent.length && Math.abs(1200 * Math.log2(r.freq / median(recent))) > 80) recent.length = 0;
    recent.push(r.freq);
    if (recent.length > 5) recent.shift();
    lastHeard = now;
    if (recent.length >= 2) showPitch(median(recent), now);
  } else if (lastHeard && now - lastHeard > 1500) {
    lastHeard = 0;
    recent.length = 0;
    inTuneSince = 0;
    resetDisplay();
  }
  rafId = requestAnimationFrame(loop);
}

els.start.addEventListener('click', () => (running ? stop() : start()));

// ---------- settings ----------
function setA4(v) {
  state.a4 = v;
  els.a4.value = v;
  els.a4Val.textContent = `${v} Hz`;
  store.set('a4', v);
}
els.a4.addEventListener('input', () => setA4(Number(els.a4.value)));
els.a4Reset.addEventListener('click', () => setA4(440));
els.tolerance.value = String(state.tolerance);
els.tolerance.addEventListener('change', () => {
  state.tolerance = Number(els.tolerance.value);
  store.set('tolerance', state.tolerance);
  updateZone();
});
els.settingsBtn.addEventListener('click', () => {
  const open = els.settings.hidden;
  els.settings.hidden = !open;
  els.settingsBtn.setAttribute('aria-expanded', String(open));
});
els.tuning.addEventListener('change', () => selectTuning(els.tuning.value));

// ---------- theme ----------
const THEME_ICONS = {
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};
function applyTheme(mode) {
  if (mode === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
  els.themeBtn.innerHTML = THEME_ICONS[mode];
  els.themeBtn.setAttribute('aria-label', `Theme: ${mode}`);
  els.themeBtn.title = `Theme: ${mode}`;
  store.set('theme', mode);
}
els.themeBtn.addEventListener('click', () => {
  const order = ['auto', 'light', 'dark'];
  const cur = store.get('theme', 'auto');
  applyTheme(order[(order.indexOf(cur) + 1) % order.length]);
});

// ---------- init ----------
applyTheme(store.get('theme', 'auto'));
setA4(state.a4);
buildGauge();
selectTuning(store.get('tuning', 'standard'));
updateModeButtons();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
