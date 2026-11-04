// Core music theory helpers: note parsing, frequencies and chord definitions.

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Spelling used when naming a detected pitch on the tuner.
export const TUNER_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function mod12(n) {
  return ((n % 12) + 12) % 12;
}

/** Pitch class (0-11) of a note name such as "F#" or "Bb". */
export function pitchClass(name) {
  const m = /^([A-G])([#b]?)$/.exec(name);
  if (!m) throw new Error(`Bad note name: ${name}`);
  return mod12(LETTER_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0));
}

/** Parse a scientific-pitch note ("E2", "F#3", "Bb3") into { name, midi }. */
export function parseNote(str) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(str);
  if (!m) throw new Error(`Bad note: ${str}`);
  const name = m[1];
  const octave = Number(m[2]);
  // Use the letter's own octave so that e.g. "Cb4" or "B#3" would still work.
  const letter = name[0];
  const acc = name.length > 1 ? (name[1] === '#' ? 1 : -1) : 0;
  return { name, octave, midi: (octave + 1) * 12 + LETTER_PC[letter] + acc };
}

export function midiToFreq(midi, a4 = 440) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq, a4 = 440) {
  return 69 + 12 * Math.log2(freq / a4);
}

/** Replace ASCII accidentals with proper music symbols for display. */
export function pretty(name) {
  return name.replace(/#/g, '♯').replace(/(?<=[A-G])b/g, '♭');
}

// Chord qualities: intervals in semitones above the root.
// `optional` intervals may be omitted when voicing (usually the fifth).
export const QUALITIES = {
  '': { intervals: [0, 4, 7], label: 'major', cat: 'major' },
  m: { intervals: [0, 3, 7], label: 'minor', cat: 'minor' },
  5: { intervals: [0, 7], label: 'power chord', cat: 'other' },
  7: { intervals: [0, 4, 7, 10], label: 'dominant 7th', cat: 'seventh' },
  maj7: { intervals: [0, 4, 7, 11], label: 'major 7th', cat: 'seventh' },
  m7: { intervals: [0, 3, 7, 10], label: 'minor 7th', cat: 'seventh' },
  9: { intervals: [0, 4, 7, 10, 2], label: 'dominant 9th', cat: 'seventh' },
  '7sus4': { intervals: [0, 5, 7, 10], label: '7th suspended 4th', cat: 'seventh' },
  m7b5: { intervals: [0, 3, 6, 10], label: 'half-diminished', cat: 'seventh' },
  dim7: { intervals: [0, 3, 6, 9], label: 'diminished 7th', cat: 'seventh' },
  6: { intervals: [0, 4, 7, 9], label: 'major 6th', cat: 'other' },
  m6: { intervals: [0, 3, 7, 9], label: 'minor 6th', cat: 'other' },
  sus2: { intervals: [0, 2, 7], label: 'suspended 2nd', cat: 'other' },
  sus4: { intervals: [0, 5, 7], label: 'suspended 4th', cat: 'other' },
  add9: { intervals: [0, 4, 7, 2], label: 'added 9th', cat: 'other' },
  madd9: { intervals: [0, 3, 7, 2], label: 'minor added 9th', cat: 'other' },
  dim: { intervals: [0, 3, 6], label: 'diminished', cat: 'other' },
  aug: { intervals: [0, 4, 8], label: 'augmented', cat: 'other' },
};

/** Parse a chord symbol like "F#m7" into its root and pitch classes. */
export function parseChord(symbol) {
  const m = /^([A-G][#b]?)(.*)$/.exec(symbol);
  if (!m || !(m[2] in QUALITIES)) throw new Error(`Unknown chord: ${symbol}`);
  const root = pitchClass(m[1]);
  const q = QUALITIES[m[2]];
  const pcs = q.intervals.map((i) => mod12(root + i));
  // The perfect fifth is optional in chords with four or more tones.
  const optional = q.intervals.length >= 4 && q.intervals.includes(7) ? [mod12(root + 7)] : [];
  const required = pcs.filter((pc) => !optional.includes(pc));
  return {
    symbol,
    rootName: m[1],
    quality: m[2],
    root,
    pcs: new Set(pcs),
    required: new Set(required),
    label: q.label,
    cat: q.cat,
  };
}

/** Transpose a chord symbol by a number of semitones. */
export function transposeChord(symbol, semitones) {
  const m = /^([A-G][#b]?)(.*)$/.exec(symbol);
  const pc = mod12(pitchClass(m[1]) + semitones);
  const names = semitones < 0 ? FLAT_NAMES : SHARP_NAMES;
  let name = names[pc];
  // Prefer the conventional Bb/Eb spellings over A#/D# when going up.
  if (semitones >= 0 && (name === 'A#' || name === 'D#')) name = FLAT_NAMES[pc];
  return name + m[2];
}
