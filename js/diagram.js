// Renders a chord shape as an SVG chord chart.

const NS = 'http://www.w3.org/2000/svg';

/**
 * @param {number[]} frets  -1 muted, 0 open, n fretted (diagram order)
 * @param {object} opts { barre, labels: string[], drone: index }
 * @returns {string} SVG markup
 */
export function chordSVG(frets, { barre = null, labels = [], drone = -1, title = '' } = {}) {
  const n = frets.length;
  const fretted = frets.filter((f) => f > 0);
  const maxF = fretted.length ? Math.max(...fretted) : 0;
  const minF = fretted.length ? Math.min(...fretted) : 0;
  const rows = Math.max(4, maxF - minF + 1);
  const base = maxF <= rows ? 1 : minF; // first fret shown
  const sx = n > 4 ? 16 : 20; // string spacing
  const fy = 20; // fret spacing
  const left = 22;
  const top = 22;
  const width = left + (n - 1) * sx + 16;
  const height = top + rows * fy + 22;

  const parts = [];
  parts.push(
    `<svg xmlns="${NS}" viewBox="0 0 ${width} ${height}" class="chord-svg" role="img" aria-label="${title}">`
  );
  // Fret lines
  for (let r = 0; r <= rows; r++) {
    const y = top + r * fy;
    parts.push(`<line x1="${left}" y1="${y}" x2="${left + (n - 1) * sx}" y2="${y}" class="fret"/>`);
  }
  // Nut or position marker
  if (base === 1) {
    parts.push(
      `<rect x="${left - 1}" y="${top - 4}" width="${(n - 1) * sx + 2}" height="5" rx="1.5" class="nut"/>`
    );
  } else {
    parts.push(`<text x="${left - 6}" y="${top + fy / 2 + 4}" class="pos" text-anchor="end">${base}</text>`);
  }
  // Strings (the banjo's short drone string is drawn dashed)
  for (let i = 0; i < n; i++) {
    const x = left + i * sx;
    const cls = i === drone ? 'string drone' : 'string';
    parts.push(`<line x1="${x}" y1="${top}" x2="${x}" y2="${top + rows * fy}" class="${cls}"/>`);
  }
  // Barre
  if (barre) {
    const y = top + (barre.fret - base + 0.5) * fy;
    const x1 = left + barre.from * sx - 6;
    const x2 = left + barre.to * sx + 6;
    parts.push(`<rect x="${x1}" y="${y - 6}" width="${x2 - x1}" height="12" rx="6" class="dot"/>`);
  }
  // Markers and dots
  frets.forEach((f, i) => {
    const x = left + i * sx;
    if (f < 0) {
      const y = top - 12;
      parts.push(
        `<path d="M${x - 4} ${y - 4}L${x + 4} ${y + 4}M${x + 4} ${y - 4}L${x - 4} ${y + 4}" class="mute"/>`
      );
    } else if (f === 0) {
      parts.push(`<circle cx="${x}" cy="${top - 12}" r="4.2" class="open"/>`);
    } else if (!(barre && f === barre.fret && i >= barre.from && i <= barre.to)) {
      const y = top + (f - base + 0.5) * fy;
      parts.push(`<circle cx="${x}" cy="${y}" r="6.5" class="dot"/>`);
    }
  });
  // String names under the chart
  labels.forEach((l, i) => {
    parts.push(
      `<text x="${left + i * sx}" y="${top + rows * fy + 16}" class="lbl" text-anchor="middle">${l}</text>`
    );
  });
  parts.push('</svg>');
  return parts.join('');
}
