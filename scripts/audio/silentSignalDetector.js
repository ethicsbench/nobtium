'use strict';

function calculateSilentSignalScore(audioBuffer) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 4) {
    return 0;
  }
  const threshold = 500;
  let nearCount = 0;
  let changeCount = 0;
  let prev = 0;
  const sampleCount = Math.floor(audioBuffer.length / 2);
  for (let i = 0; i < sampleCount; i++) {
    const sample = audioBuffer.readInt16LE(i * 2);
    if (Math.abs(sample) < threshold) {
      nearCount += 1;
      if (Math.abs(sample - prev) > 50) {
        changeCount += 1;
      }
    }
    prev = sample;
  }
  if (nearCount === 0) {
    return 0;
  }
  const score = changeCount / nearCount;
  return Math.max(0, Math.min(1, score));
}

module.exports = { calculateSilentSignalScore };
