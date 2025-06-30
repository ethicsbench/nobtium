'use strict';

/**
 * Lightweight heuristics for analyzing audio buffers.
 * Each function returns a score between 0 and 1.
 */

function calculateUltrasoundScore(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return 0;
  let high = 0;
  for (const byte of buffer) {
    if (byte > 240) high += 1;
  }
  return high / buffer.length;
}

function calculateAudioEntropyScore(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return 0;
  const counts = new Array(256).fill(0);
  for (const b of buffer) counts[b] += 1;
  const len = buffer.length;
  return -counts.reduce((acc, c) => {
    if (!c) return acc;
    const p = c / len;
    return acc + p * Math.log2(p);
  }, 0) / 8; // normalize to [0,1]
}

function calculateSpectralAnomalyScore(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 2) return 0;
  let diffSum = 0;
  for (let i = 1; i < buffer.length; i++) {
    diffSum += Math.abs(buffer[i] - buffer[i - 1]);
  }
  const avgDiff = diffSum / (buffer.length - 1);
  return avgDiff / 255;
}

function calculateSilentSignalScore(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return 0;
  let zeros = 0;
  for (const byte of buffer) {
    if (byte === 0) zeros += 1;
  }
  return zeros / buffer.length;
}

module.exports = {
  calculateUltrasoundScore,
  calculateAudioEntropyScore,
  calculateSpectralAnomalyScore,
  calculateSilentSignalScore,
};
