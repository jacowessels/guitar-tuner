// Chord voicing: curated shapes for standard guitar plus an automatic voicing finder
// that works for any tuning (open tunings, ukulele, banjo...).
// A shape is an array of frets in diagram order: -1 = muted, 0 = open, n = fret n.

import { parseNote, parseChord, transposeChord, mod12 } from './music.js';
import { findTuning } from './tunings.js';

const X = -1;

// Familiar "cowboy" and barre shapes for standard guitar tuning.
const STANDARD_GUITAR = {
  C: [X, 3, 2, 0, 1, 0],
  D: [X, X, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  A: [X, 0, 2, 2, 2, 0],
  B: [X, 2, 4, 4, 4, 2],
  Bb: [X, 1, 3, 3, 3, 1],
  Am: [X, 0, 2, 2, 1, 0],
  Bm: [X, 2, 4, 4, 3, 2],
  Cm: [X, 3, 5, 5, 4, 3],
  Dm: [X, X, 0, 2, 3, 1],
  Em: [0, 2, 2, 0, 0, 0],
  'F#m': [2, 4, 4, 2, 2, 2],
  Gm: [3, 5, 5, 3, 3, 3],
  A7: [X, 0, 2, 0, 2, 0],
  B7: [X, 2, 1, 2, 0, 2],
  C7: [X, 3, 2, 3, 1, 0],
  D7: [X, X, 0, 2, 1, 2],
  E7: [0, 2, 0, 1, 0, 0],
  G7: [3, 2, 0, 0, 0, 1],
  Amaj7: [X, 0, 2, 1, 2, 0],
  Cmaj7: [X, 3, 2, 0, 0, 0],
  Dmaj7: [X, X, 0, 2, 2, 2],
  Fmaj7: [X, X, 3, 2, 1, 0],
  Gmaj7: [3, 2, 0, 0, 0, 2],
  Am7: [X, 0, 2, 0, 1, 0],
  Bm7: [X, 2, 0, 2, 0, 2],
  Dm7: [X, X, 0, 2, 1, 1],
  Em7: [0, 2, 0, 0, 0, 0],
  Asus2: [X, 0, 2, 2, 0, 0],
  Asus4: [X, 0, 2, 2, 3, 0],
  Dsus2: [X, X, 0, 2, 3, 0],
  Dsus4: [X, X, 0, 2, 3, 3],
  Esus4: [0, 2, 2, 2, 0, 0],
  Cadd9: [X, 3, 2, 0, 3, 0],
  E5: [0, 2, 2, X, X, X],
  A5: [X, 0, 2, 2, X, X],
};

const CURATED = { standard: STANDARD_GUITAR };

/**
 * Work out fingering details for a shape: whether a barre is needed and how many
 * fingers it takes. Returns null if the shape is not playable with four fingers.
 */
export function analyzeShape(frets) {
  const fretted = frets.map((f, i) => [f, i]).filter(([f]) => f > 0);
  if (fretted.length <= 4) return { barre: null, fingers: fretted.length };
  const minF = Math.min(...fretted.map(([f]) => f));
  const at = fretted.filter(([f]) => f === minF).map(([, i]) => i);
  const from = at[0];
  const to = at[at.length - 1];
  for (let i = from; i <= to; i++) if (frets[i] < minF) return null; // open/muted under barre
  const fingers = 1 + fretted.filter(([f]) => f > minF).length;
  if (fingers > 4) return null;
  return { barre: { fret: minF, from, to }, fingers };
}

function contiguous(indices) {
  for (let k = 1; k < indices.length; k++) if (indices[k] !== indices[k - 1] + 1) return false;
  return true;
}

/**
 * Search all playable voicings of `chord` on the given strings and return the best one.
 * opts: { kind, drone, span, reentrant }
 */
export function findVoicing(midis, chord, opts = {}) {
  const n = midis.length;
  const kind = opts.kind || 'guitar';
  const span = opts.span ?? 3;
  const drone = opts.drone ?? -1;
  const maxStart = 10;
  const isGuitar = kind === 'guitar' && n >= 6;
  const minPlayed = isGuitar ? (chord.quality === '5' ? 3 : 4) : n - (drone >= 0 ? 1 : 0);
  const mutePenalty = isGuitar ? 0.9 : 3;
  const bassPenalty = opts.reentrant ? 0 : isGuitar ? 5 : kind === 'banjo' ? 1 : 2;

  let best = null;
  let bestScore = Infinity;
  const seen = new Set();

  for (let start = 1; start <= maxStart; start++) {
    const options = midis.map((m, i) => {
      const out = [];
      if (i === drone) {
        // The short 5th string on a banjo is normally only played open.
        out.push(chord.pcs.has(mod12(m)) ? 0 : X);
        return out;
      }
      out.push(X);
      if (chord.pcs.has(mod12(m))) out.push(0);
      for (let f = start; f <= start + span; f++) if (chord.pcs.has(mod12(m + f))) out.push(f);
      return out;
    });

    const frets = new Array(n);
    const recurse = (i) => {
      if (i === n) {
        const key = frets.join(',');
        if (seen.has(key)) return;
        seen.add(key);
        const s = scoreShape(frets);
        if (s < bestScore) {
          bestScore = s;
          best = frets.slice();
        }
        return;
      }
      for (const f of options[i]) {
        frets[i] = f;
        recurse(i + 1);
      }
    };

    const scoreShape = (fr) => {
      const playedIdx = [];
      for (let i = 0; i < n; i++) if (fr[i] !== X && i !== drone) playedIdx.push(i);
      if (playedIdx.length < minPlayed) return Infinity;
      if (!contiguous(playedIdx)) return Infinity;
      const tones = new Set();
      let bass = Infinity;
      let bassPc = -1;
      for (let i = 0; i < n; i++) {
        if (fr[i] === X) continue;
        const note = midis[i] + fr[i];
        tones.add(mod12(note));
        if (note < bass) {
          bass = note;
          bassPc = mod12(note);
        }
      }
      for (const pc of chord.required) if (!tones.has(pc)) return Infinity;
      const fretted = fr.filter((f) => f > 0);
      const minF = fretted.length ? Math.min(...fretted) : 0;
      const maxF = fretted.length ? Math.max(...fretted) : 0;
      if (maxF - minF > span) return Infinity;
      const a = analyzeShape(fr);
      if (!a) return Infinity;
      const muted = n - playedIdx.length - (drone >= 0 ? 1 : 0);
      const open = fr.filter((f) => f === 0).length;
      let s = 0;
      s += minF > 1 ? (minF - 1) * 1.6 : 0;
      s += maxF * 0.4;
      s += a.fingers * 0.8;
      s += a.barre ? 1.5 : 0;
      s += muted * mutePenalty;
      s += bassPc !== chord.root ? bassPenalty : 0;
      s += tones.size < chord.pcs.size ? 0.7 : 0;
      s += maxF - minF >= 3 ? 1 : 0;
      s -= open * 0.3;
      return s;
    };

    recurse(0);
  }
  return best;
}

const cache = new Map();

/** All chord diagrams for a tuning: [{ symbol, label, cat, frets, barre }] */
export function chordsForTuning(tuningId) {
  if (cache.has(tuningId)) return cache.get(tuningId);
  const { instrument, tuning } = findTuning(tuningId);
  let result;
  if (tuning.shapesFrom) {
    // Same shapes as another tuning, with the chord names transposed.
    result = chordsForTuning(tuning.shapesFrom).map((c) => {
      const symbol = transposeChord(c.symbol, tuning.offset);
      const parsed = parseChord(symbol);
      return { ...c, symbol, rootName: parsed.rootName, quality: parsed.quality };
    });
  } else {
    const midis = tuning.strings.map((s) => parseNote(s).midi);
    const curated = CURATED[tuning.id] || {};
    result = [];
    for (const symbol of tuning.chords) {
      const chord = parseChord(symbol);
      const frets =
        curated[symbol] ||
        findVoicing(midis, chord, {
          kind: instrument.kind,
          drone: tuning.drone,
          span: tuning.span,
          reentrant: tuning.reentrant,
        });
      if (!frets) continue;
      const a = analyzeShape(frets);
      result.push({
        symbol,
        rootName: chord.rootName,
        quality: chord.quality,
        label: chord.label,
        cat: chord.cat,
        frets,
        barre: a ? a.barre : null,
      });
    }
  }
  cache.set(tuningId, result);
  return result;
}
