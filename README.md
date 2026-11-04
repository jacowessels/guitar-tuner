# String Tuner

A free, installable web app (PWA) tuner for **guitar, ukulele and banjo**, with chord charts for every tuning.

## Features

- **Microphone tuner** with a needle gauge showing how many cents sharp or flat you are.
  The card turns amber when you're close and **green when you're in tune** (±5 cents by default).
- **Auto string detection**, or tap a string to lock the tuner to it.
- **Reference tones**: turn on *Play tone* and tap a string to hear its target note.
- **Tunings**
  - Guitar: Standard, Drop D, Half step down, Full step down, Drop C, DADGAD,
    Open G, Open D, Open E, Open A, Open C, Open D minor
  - Ukulele: Standard (re-entrant GCEA), Low G, D tuning (ADF♯B), Baritone (DGBE)
  - Banjo: 5-string Open G, Double C, Open D, G modal (Sawmill), C tuning; Tenor (CGDA) and Irish tenor (GDAE)
- **Chord charts** (24–38 per tuning) with filters for major, minor, 7ths and others. Tap a chart to hear it strummed.
- **A4 calibration** (430–450 Hz) and adjustable in-tune tolerance.
- Light/dark theme (follows your device, or set it manually).
- Works offline after the first visit; add it to your home screen to use it like an app.

## How it works

Everything runs in the browser, there is no server:

- `js/pitch.js` – pitch detection using the McLeod Pitch Method (accurate to well under 1 cent).
- `js/tunings.js` – instruments, tunings and which chords to show for each.
- `js/chords.js` – curated shapes for standard guitar plus a voicing finder that searches the
  fretboard for the most playable shape of any chord in any tuning (low frets, open strings,
  four fingers max, root in the bass).
- `js/diagram.js` – draws chord charts as SVG.
- `sw.js` – service worker for offline use.

## Run locally

The microphone needs `https` or `localhost`:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Tests

```bash
node tests/run.js
```

Checks pitch detection on every open string of every tuning, and verifies that every chord chart
plays only the right notes, includes all required chord tones and is playable with four fingers.

## Deploying (free) on GitHub Pages

1. Make the repository public (GitHub Pages is free for public repos).
2. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Merge into `main`. The workflow in `.github/workflows/deploy.yml` runs the tests and publishes the site to
   `https://<your-username>.github.io/guitar-tuner/`.
