// Pitch detection using the McLeod Pitch Method (normalised square difference function).
// Works well for plucked strings and is cheap enough to run many times per second.

/**
 * Detect the fundamental frequency of a block of audio samples.
 * @param {Float32Array} input  mono samples in the range [-1, 1]
 * @param {number} sampleRate
 * @param {object} [opts] { minFreq, maxFreq, minRms }
 * @returns {{freq:number, clarity:number, rms:number} | null}
 */
export function detectPitch(input, sampleRate, opts = {}) {
  const minFreq = opts.minFreq ?? 55;
  const maxFreq = opts.maxFreq ?? 1300;
  const minRms = opts.minRms ?? 0.008;

  // Downsample by 2 at high sample rates: halves the work with no loss of accuracy
  // for the frequencies we care about.
  let buf = input;
  let sr = sampleRate;
  if (sampleRate >= 44100) {
    const half = new Float32Array(input.length >> 1);
    for (let i = 0; i < half.length; i++) half[i] = 0.5 * (input[2 * i] + input[2 * i + 1]);
    buf = half;
    sr = sampleRate / 2;
  }

  const n = buf.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += buf[i];
  mean /= n;
  let rms = 0;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = buf[i] - mean;
    rms += x[i] * x[i];
  }
  rms = Math.sqrt(rms / n);
  if (rms < minRms) return null;

  const maxLag = Math.min(Math.ceil(sr / minFreq), Math.floor(n / 2));
  const minLag = Math.floor(sr / maxFreq);
  const nsdf = new Float32Array(maxLag + 2);
  for (let tau = 0; tau <= maxLag + 1; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0, end = n - tau; i < end; i++) {
      const a = x[i];
      const b = x[i + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Collect the highest point of each positive lobe after the first zero crossing.
  const peaks = [];
  let tau = 1;
  while (tau <= maxLag && nsdf[tau] > 0) tau++;
  let bestIdx = -1;
  for (; tau <= maxLag; tau++) {
    if (nsdf[tau] > 0) {
      if (bestIdx < 0 || nsdf[tau] > nsdf[bestIdx]) bestIdx = tau;
    } else if (bestIdx >= 0) {
      peaks.push(bestIdx);
      bestIdx = -1;
    }
  }
  if (bestIdx >= 0 && bestIdx < maxLag) peaks.push(bestIdx);
  if (!peaks.length) return null;

  let highest = 0;
  for (const p of peaks) if (nsdf[p] > highest) highest = nsdf[p];
  const threshold = 0.9 * highest;
  const period = peaks.find((p) => p >= minLag && nsdf[p] >= threshold);
  if (period === undefined) return null;

  // Parabolic interpolation around the peak for sub-sample accuracy.
  const a = nsdf[period - 1];
  const b = nsdf[period];
  const c = nsdf[period + 1];
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const refined = period + shift;
  const freq = sr / refined;
  if (freq < minFreq || freq > maxFreq) return null;
  return { freq, clarity: b, rms };
}
