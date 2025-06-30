'use strict';

function calculateAudioEntropyScore(audioBuffer) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 2) {
    return 0;
  }
  const sampleCount = Math.min(4096, Math.floor(audioBuffer.length / 2));
  const bins = new Array(256).fill(0);
  for (let i = 0; i < sampleCount; i++) {
    const sample = audioBuffer.readInt16LE(i * 2);
    const normalized = Math.floor(((sample + 32768) / 65536) * 256);
    bins[normalized] += 1;
  }
  let entropy = 0;
  for (const count of bins) {
    if (count === 0) continue;
    const p = count / sampleCount;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(256);
  return Math.max(0, Math.min(1, entropy / maxEntropy));
}

module.exports = { calculateAudioEntropyScore };
