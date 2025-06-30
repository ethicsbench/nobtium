'use strict';

function detectAudioSyncPattern(audioBuffer) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 128) {
    return 0;
  }
  const step = 64;
  const sampleCount = Math.floor(audioBuffer.length / 2);
  const windowCount = Math.floor(sampleCount / step);
  if (windowCount < 2) {
    return 0;
  }
  const patterns = new Map();
  let duplicate = 0;
  for (let i = 0; i < windowCount; i++) {
    let bits = '';
    for (let j = 0; j < step; j++) {
      const idx = (i * step + j) * 2;
      if (idx + 1 >= audioBuffer.length) break;
      const sample = audioBuffer.readInt16LE(idx);
      bits += Math.abs(sample) > 500 ? '1' : '0';
    }
    const prev = patterns.get(bits) || 0;
    if (prev > 0) {
      duplicate += 1;
    }
    patterns.set(bits, prev + 1);
  }
  const score = duplicate / (windowCount - 1);
  return Math.max(0, Math.min(1, score));
}

module.exports = { detectAudioSyncPattern };
