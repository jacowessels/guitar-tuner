// Instruments, tunings and the chord list shown for each tuning.
// Strings are listed in diagram order (left to right as you look at a chord chart):
// for guitar and ukulele that is the thickest string first; for 5-string banjo it is
// the short 5th (drone) string first, then strings 4 to 1.

const GUITAR_STD_CHORDS = [
  'C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb',
  'Am', 'Bm', 'Cm', 'Dm', 'Em', 'F#m', 'Gm',
  'A7', 'B7', 'C7', 'D7', 'E7', 'G7',
  'Amaj7', 'Cmaj7', 'Dmaj7', 'Fmaj7', 'Gmaj7',
  'Am7', 'Bm7', 'Dm7', 'Em7',
  'Asus2', 'Asus4', 'Dsus2', 'Dsus4', 'Esus4', 'Cadd9', 'E5', 'A5',
];

const UKE_CHORDS = [
  'C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'B',
  'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm',
  'A7', 'B7', 'C7', 'D7', 'E7', 'G7',
  'Cmaj7', 'Fmaj7', 'Gmaj7',
  'Am7', 'Dm7', 'Em7',
  'Csus2', 'Csus4', 'Dsus4', 'Gsus4', 'Asus4', 'Cadd9', 'C6',
];

export const INSTRUMENTS = [
  {
    id: 'guitar',
    name: 'Guitar',
    kind: 'guitar',
    tunings: [
      {
        id: 'standard', name: 'Standard', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
        desc: 'The everyday tuning used for most songs.',
        chords: GUITAR_STD_CHORDS,
      },
      {
        id: 'drop-d', name: 'Drop D', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
        desc: 'Low E dropped to D. One-finger power chords and a big low D for rock and folk.',
        chords: [
          'D', 'G', 'A', 'C', 'F', 'E', 'Bb',
          'Dm', 'Em', 'Am', 'Bm',
          'D7', 'A7', 'G7', 'E7', 'Dmaj7', 'Gmaj7', 'Em7', 'Am7',
          'Dsus2', 'Dsus4', 'Asus4', 'Dadd9', 'D5', 'E5', 'G5', 'A5', 'C5',
        ],
      },
      {
        id: 'half-down', name: 'Half step down (E♭)', strings: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
        desc: 'Every string a semitone lower. Same shapes as standard, chords sound a semitone lower.',
        shapesFrom: 'standard', offset: -1,
      },
      {
        id: 'full-down', name: 'Full step down (D standard)', strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
        desc: 'Every string a whole tone lower. Same shapes as standard, chords sound two semitones lower.',
        shapesFrom: 'standard', offset: -2,
      },
      {
        id: 'drop-c', name: 'Drop C', strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
        desc: 'Drop D tuned down a whole tone. Heavy, low rock and metal riffs.',
        shapesFrom: 'drop-d', offset: -2,
      },
      {
        id: 'dadgad', name: 'DADGAD', strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
        desc: 'Open strings ring as Dsus4. Celtic, folk and fingerstyle.',
        chords: [
          'D', 'G', 'A', 'C', 'F', 'Bb', 'E',
          'Dm', 'Em', 'Bm', 'Am',
          'D7', 'A7', 'G7', 'Dmaj7', 'Gmaj7', 'Em7', 'Bm7',
          'Dsus2', 'Dsus4', 'Asus4', 'Gsus2', 'Dadd9', 'Gadd9', 'D5', 'G5', 'A5',
        ],
      },
      {
        id: 'open-g', name: 'Open G', strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
        desc: 'Open strings form G major. Blues, slide and classic rock rhythm.',
        chords: [
          'G', 'C', 'D', 'F', 'A', 'E', 'Bb',
          'Em', 'Am', 'Bm', 'Gm',
          'G7', 'C7', 'D7', 'A7', 'Gmaj7', 'Cmaj7', 'Em7', 'Am7',
          'Gsus2', 'Gsus4', 'Dsus4', 'Gadd9', 'G6', 'G5', 'C5', 'D5',
        ],
      },
      {
        id: 'open-d', name: 'Open D', strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
        desc: 'Open strings form D major. Slide, folk and singer-songwriter.',
        chords: [
          'D', 'G', 'A', 'C', 'E', 'F', 'Bb',
          'Bm', 'Em', 'F#m', 'Dm',
          'D7', 'G7', 'A7', 'E7', 'Dmaj7', 'Gmaj7', 'Bm7', 'Em7',
          'Dsus2', 'Dsus4', 'Asus4', 'Dadd9', 'D6', 'D5', 'G5', 'A5',
        ],
      },
      {
        id: 'open-e', name: 'Open E', strings: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
        desc: 'Open strings form E major. Bright slide guitar and blues.',
        chords: [
          'E', 'A', 'B', 'D', 'F#', 'G', 'C',
          'C#m', 'F#m', 'G#m', 'Em',
          'E7', 'A7', 'B7', 'F#7', 'Emaj7', 'Amaj7', 'C#m7', 'F#m7',
          'Esus2', 'Esus4', 'Bsus4', 'Eadd9', 'E6', 'E5', 'A5', 'B5',
        ],
      },
      {
        id: 'open-a', name: 'Open A', strings: ['E2', 'A2', 'E3', 'A3', 'C#4', 'E4'],
        desc: 'Open strings form A major. Slide and blues, same shapes as open G two frets up.',
        chords: [
          'A', 'D', 'E', 'G', 'B', 'F#', 'C',
          'F#m', 'Bm', 'C#m', 'Am',
          'A7', 'D7', 'E7', 'B7', 'Amaj7', 'Dmaj7', 'F#m7', 'Bm7',
          'Asus2', 'Asus4', 'Esus4', 'Aadd9', 'A6', 'A5', 'D5', 'E5',
        ],
      },
      {
        id: 'open-c', name: 'Open C', strings: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'],
        desc: 'Open strings form C major. Deep, resonant fingerstyle and drones.',
        chords: [
          'C', 'F', 'G', 'Bb', 'D', 'A', 'Eb',
          'Am', 'Dm', 'Em', 'Cm',
          'C7', 'F7', 'G7', 'D7', 'Cmaj7', 'Fmaj7', 'Am7', 'Dm7',
          'Csus2', 'Csus4', 'Gsus4', 'Cadd9', 'C6', 'C5', 'F5', 'G5',
        ],
      },
      {
        id: 'open-dm', name: 'Open D minor', strings: ['D2', 'A2', 'D3', 'F3', 'A3', 'D4'],
        desc: 'Open strings form D minor. Dark, bluesy and modal sounds.',
        chords: [
          'Dm', 'Gm', 'Am', 'Em',
          'D', 'F', 'G', 'A', 'Bb', 'C', 'E',
          'Dm7', 'Gm7', 'Am7', 'A7', 'C7', 'D7', 'Fmaj7', 'Bbmaj7',
          'Dsus2', 'Dsus4', 'Asus4', 'Dm6', 'Dmadd9', 'D5', 'A5', 'G5',
        ],
      },
    ],
  },
  {
    id: 'ukulele',
    name: 'Ukulele',
    kind: 'ukulele',
    tunings: [
      {
        id: 'uke-standard', name: 'Standard (GCEA)', strings: ['G4', 'C4', 'E4', 'A4'],
        desc: 'Soprano, concert and tenor ukulele. The G string is high (re-entrant).',
        chords: UKE_CHORDS, reentrant: true,
      },
      {
        id: 'uke-low-g', name: 'Low G (GCEA)', strings: ['G3', 'C4', 'E4', 'A4'],
        desc: 'Same as standard but with a low G string for a fuller bass.',
        chords: UKE_CHORDS,
      },
      {
        id: 'uke-d', name: 'D tuning (ADF♯B)', strings: ['A4', 'D4', 'F#4', 'B4'],
        desc: 'Traditional brighter tuning, a whole tone up. Same shapes as standard, chords sound two semitones higher.',
        shapesFrom: 'uke-standard', offset: 2, reentrant: true,
      },
      {
        id: 'uke-baritone', name: 'Baritone (DGBE)', strings: ['D3', 'G3', 'B3', 'E4'],
        desc: 'Baritone ukulele. Same as the top four strings of a guitar.',
        chords: [
          'G', 'C', 'D', 'E', 'F', 'A', 'B', 'Bb',
          'Am', 'Bm', 'Dm', 'Em', 'F#m', 'Gm',
          'A7', 'B7', 'C7', 'D7', 'E7', 'G7',
          'Cmaj7', 'Dmaj7', 'Fmaj7', 'Gmaj7', 'Am7', 'Dm7', 'Em7',
          'Asus4', 'Dsus2', 'Dsus4',
        ],
      },
    ],
  },
  {
    id: 'banjo',
    name: 'Banjo',
    kind: 'banjo',
    tunings: [
      {
        id: 'banjo-open-g', name: '5-string Open G (gDGBD)', strings: ['G4', 'D3', 'G3', 'B3', 'D4'],
        desc: 'The standard bluegrass tuning. Open strings form G major.',
        drone: 0,
        chords: [
          'G', 'C', 'D', 'F', 'A', 'E', 'Bb',
          'Em', 'Am', 'Bm', 'Dm', 'Gm',
          'G7', 'C7', 'D7', 'A7', 'E7', 'B7',
          'Gmaj7', 'Cmaj7', 'Em7', 'Am7',
          'Gsus4', 'Dsus4', 'G6', 'C6', 'Gadd9',
        ],
      },
      {
        id: 'banjo-double-c', name: '5-string Double C (gCGCD)', strings: ['G4', 'C3', 'G3', 'C4', 'D4'],
        desc: 'Clawhammer and old-time favourite for tunes in C.',
        drone: 0,
        chords: [
          'C', 'F', 'G', 'D', 'Bb', 'A', 'E',
          'Am', 'Dm', 'Em', 'Cm',
          'C7', 'F7', 'G7', 'D7', 'A7',
          'Cmaj7', 'Fmaj7', 'Am7', 'Dm7',
          'Csus2', 'Gsus4', 'C6', 'C5', 'G5', 'F5',
        ],
      },
      {
        id: 'banjo-open-d', name: '5-string Open D (f♯DF♯AD)', strings: ['F#4', 'D3', 'F#3', 'A3', 'D4'],
        desc: 'Open strings form D major. Old-time and slide-style tunes in D.',
        drone: 0,
        chords: [
          'D', 'G', 'A', 'C', 'E', 'F', 'B',
          'Bm', 'Em', 'F#m', 'Dm',
          'D7', 'G7', 'A7', 'E7', 'B7',
          'Dmaj7', 'Gmaj7', 'Bm7', 'Em7',
          'Dsus4', 'Asus4', 'D6', 'G6',
        ],
      },
      {
        id: 'banjo-g-modal', name: '5-string G modal / Sawmill (gDGCD)', strings: ['G4', 'D3', 'G3', 'C4', 'D4'],
        desc: 'Open strings ring as Gsus4. Haunting old-time modal tunes.',
        drone: 0,
        chords: [
          'G', 'Gm', 'C', 'D', 'F', 'Bb', 'A',
          'Am', 'Dm', 'Em', 'Cm',
          'G7', 'C7', 'D7', 'Gm7', 'Am7', 'Dm7',
          'Gsus4', 'Gsus2', 'Dsus4', 'Csus2', 'G5', 'D5', 'C5', 'F5',
        ],
      },
      {
        id: 'banjo-c', name: '5-string C tuning (gCGBD)', strings: ['G4', 'C3', 'G3', 'B3', 'D4'],
        desc: 'Classic-style tuning: open G with the 4th string dropped to C.',
        drone: 0,
        chords: [
          'C', 'F', 'G', 'D', 'A', 'E', 'Bb',
          'Am', 'Dm', 'Em', 'Bm',
          'C7', 'F7', 'G7', 'D7', 'A7', 'E7',
          'Cmaj7', 'Fmaj7', 'Gmaj7', 'Am7', 'Dm7', 'Em7',
          'Gsus4', 'Csus4', 'C6', 'G6',
        ],
      },
      {
        id: 'banjo-tenor', name: 'Tenor banjo (CGDA)', strings: ['C3', 'G3', 'D4', 'A4'],
        desc: '4-string tenor banjo tuned in fifths, used in jazz and dixieland.',
        span: 4,
        chords: [
          'C', 'D', 'E', 'F', 'G', 'A', 'Bb',
          'Am', 'Bm', 'Dm', 'Em', 'Gm',
          'C7', 'D7', 'E7', 'F7', 'G7', 'A7',
          'Cmaj7', 'Fmaj7', 'Gmaj7', 'Am7', 'Dm7', 'Em7',
          'C6', 'F6', 'Cdim7',
        ],
      },
      {
        id: 'banjo-irish', name: 'Irish tenor banjo (GDAE)', strings: ['G2', 'D3', 'A3', 'E4'],
        desc: '4-string tenor banjo tuned an octave below a fiddle, for Irish traditional music.',
        span: 4,
        chords: [
          'G', 'D', 'A', 'C', 'E', 'F', 'B',
          'Em', 'Am', 'Bm', 'Dm', 'F#m',
          'G7', 'D7', 'A7', 'E7', 'B7',
          'Gmaj7', 'Dmaj7', 'Em7', 'Am7', 'Bm7',
          'Dsus4', 'Asus4', 'G6',
        ],
      },
    ],
  },
];

export function findTuning(id) {
  for (const inst of INSTRUMENTS) {
    for (const t of inst.tunings) if (t.id === id) return { instrument: inst, tuning: t };
  }
  return null;
}
