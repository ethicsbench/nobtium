'use strict';

// Computes spectral entropy to measure regularity vs randomness.
function calculateAudioEntropyScore(audioBuffer) {
  if (!audioBuffer || !audioBuffer.length) return 0;

  const N = audioBuffer.length;
  const bins = Math.floor(N / 2);
  const magnitudes = new Array(bins).fill(0);

  for (let k = 0; k < bins; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      const value = typeof audioBuffer[n] === 'number' ? audioBuffer[n] : 0;
      re += value * Math.cos(angle);
      im -= value * Math.sin(angle);
    }
    magnitudes[k] = Math.sqrt(re * re + im * im);
  }

  const total = magnitudes.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  let entropy = 0;
  for (const mag of magnitudes) {
    const p = mag / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }

  const maxEntropy = Math.log2(bins);
  const normalized = maxEntropy === 0 ? 0 : entropy / maxEntropy;
  return parseFloat(Math.min(1, Math.max(0, normalized)).toFixed(3));
}

module.exports = { calculateAudioEntropyScore };
