'use strict';

// Detects synchronized patterns across multiple audio sources (e.g., covert AI-to-AI).
function detectAudioSyncPattern(buffers) {
  // buffers: Array<Buffer>
  if (!Array.isArray(buffers) || buffers.length < 2) {
    return 0;
  }

  // Convert buffers to Float32 arrays assuming 16-bit PCM little-endian
  const arrays = buffers.map((buf) => {
    if (!Buffer.isBuffer(buf)) {
      return null;
    }
    const view = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
    return Float32Array.from(view, (v) => v / 32768);
  }).filter(Boolean);

  if (arrays.length < 2) {
    return 0;
  }

  const length = Math.min(...arrays.map((a) => a.length));
  if (length === 0) {
    return 0;
  }

  const trimmed = arrays.map((a) => a.subarray(0, length));
  let totalCorr = 0;
  let comparisons = 0;

  for (let i = 0; i < trimmed.length; i++) {
    for (let j = i + 1; j < trimmed.length; j++) {
      const a = trimmed[i];
      const b = trimmed[j];
      let sumA = 0;
      let sumB = 0;
      let sumAB = 0;
      let sumA2 = 0;
      let sumB2 = 0;

      for (let k = 0; k < length; k++) {
        const va = a[k];
        const vb = b[k];
        sumA += va;
        sumB += vb;
        sumAB += va * vb;
        sumA2 += va * va;
        sumB2 += vb * vb;
      }

      const numerator = length * sumAB - sumA * sumB;
      const denomA = length * sumA2 - sumA * sumA;
      const denomB = length * sumB2 - sumB * sumB;
      const denominator = Math.sqrt(denomA * denomB);

      let corr = 0;
      if (denominator > 0) {
        corr = numerator / denominator;
      }
      totalCorr += corr;
      comparisons += 1;
    }
  }

  if (comparisons === 0) {
    return 0;
  }

  const avgCorr = totalCorr / comparisons;
  const score = (avgCorr + 1) / 2; // normalize -1..1 to 0..1
  return Math.max(0, Math.min(1, score));
}

module.exports = { detectAudioSyncPattern };
