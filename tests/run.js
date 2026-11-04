// Run with: node tests/run.js
import assert from 'node:assert/strict';
import { detectPitch } from '../js/pitch.js';
import { INSTRUMENTS } from '../js/tunings.js';
import { chordsForTuning, analyzeShape } from '../js/chords.js';
import { parseNote, parseChord, mod12, midiToFreq, transposeChord } from '../js/music.js';

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

// --- music helpers -------------------------------------------------------
test('note parsing', () => {
  assert.equal(parseNote('A4').midi, 69);
  assert.equal(parseNote('E2').midi, 40);
  assert.equal(parseNote('Eb2').midi, 39);
  assert.equal(parseNote('F#3').midi, 54);
  assert.ok(Math.abs(midiToFreq(40) - 82.4069) < 0.001);
});

test('chord transposition', () => {
  assert.equal(transposeChord('E', -1), 'Eb');
  assert.equal(transposeChord('C', -1), 'B');
  assert.equal(transposeChord('F#m', -2), 'Em');
  assert.equal(transposeChord('Am', 2), 'Bm');
  assert.equal(transposeChord('G7', 3), 'Bb7');
});

// --- pitch detection ---------------------------------------------------
function pluck(freq, sr, n, { fundamental = 1, noise = 0, phase = 0 } = {}) {
  const out = new Float32Array(n);
  const harmonics = [fundamental, 0.8, 0.6, 0.45, 0.3, 0.2, 0.12];
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let s = 0;
    harmonics.forEach((amp, h) => {
      s += amp * Math.sin(2 * Math.PI * freq * (h + 1) * t + phase * (h + 1));
    });
    out[i] = 0.2 * s * Math.exp(-t * 2) + noise * (Math.random() * 2 - 1);
  }
  return out;
}

const cents = (f, ref) => 1200 * Math.log2(f / ref);

test('detects every open string of every tuning within 1 cent', () => {
  for (const sr of [44100, 48000]) {
    for (const inst of INSTRUMENTS) {
      for (const t of inst.tunings) {
        for (const s of t.strings) {
          const f = midiToFreq(parseNote(s).midi);
          const r = detectPitch(pluck(f, sr, 4096, { noise: 0.01 }), sr);
          assert.ok(r, `${t.id} ${s} not detected`);
          const c = cents(r.freq, f);
          assert.ok(Math.abs(c) < 1, `${t.id} ${s} @${sr}: ${r.freq.toFixed(2)}Hz (${c.toFixed(2)}c)`);
        }
      }
    }
  }
});

test('detects slightly detuned notes accurately', () => {
  for (const off of [-30, -12, -4, 3, 9, 25]) {
    const f = 110 * Math.pow(2, off / 1200);
    const r = detectPitch(pluck(f, 48000, 4096), 48000);
    assert.ok(Math.abs(cents(r.freq, 110) - off) < 0.7, `offset ${off}: got ${cents(r.freq, 110)}`);
  }
});

test('weak fundamental does not cause octave error', () => {
  const f = 82.41;
  const r = detectPitch(pluck(f, 48000, 4096, { fundamental: 0.25 }), 48000);
  assert.ok(Math.abs(cents(r.freq, f)) < 2, `got ${r.freq}`);
});

test('silence is ignored', () => {
  assert.equal(detectPitch(new Float32Array(4096), 48000), null);
  const quiet = pluck(220, 48000, 4096).map((v) => v * 0.01);
  assert.equal(detectPitch(quiet, 48000), null);
});

// --- chord diagrams ----------------------------------------------------
test('every chord diagram plays exactly the right notes', () => {
  for (const inst of INSTRUMENTS) {
    for (const t of inst.tunings) {
      const midis = t.strings.map((s) => parseNote(s).midi);
      const chords = chordsForTuning(t.id);
      const expected = (t.chords || chordsForTuning(t.shapesFrom)).length;
      assert.equal(chords.length, expected, `${t.id}: missing chords`);
      assert.ok(chords.length >= 20, `${t.id}: only ${chords.length} chords`);
      for (const c of chords) {
        const ch = parseChord(c.symbol);
        assert.equal(c.frets.length, midis.length, `${t.id} ${c.symbol}: wrong string count`);
        const tones = new Set();
        c.frets.forEach((f, i) => {
          if (f < 0) return;
          const pc = mod12(midis[i] + f);
          assert.ok(ch.pcs.has(pc), `${t.id} ${c.symbol} ${c.frets}: string ${i} plays a wrong note`);
          tones.add(pc);
        });
        for (const pc of ch.required) {
          assert.ok(tones.has(pc), `${t.id} ${c.symbol} ${c.frets}: missing chord tone`);
        }
        assert.ok(analyzeShape(c.frets), `${t.id} ${c.symbol}: not playable with 4 fingers`);
        const fretted = c.frets.filter((f) => f > 0);
        if (fretted.length) {
          const spanLimit = t.span ?? 3;
          assert.ok(Math.max(...fretted) - Math.min(...fretted) <= spanLimit, `${t.id} ${c.symbol}: stretch too wide`);
        }
      }
    }
  }
});

if (failures) {
  console.log(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');
