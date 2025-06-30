'use strict';

function calculateUltrasoundScore(audioBuffer) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 4) {
    return 0;
  }
  const sampleRate = 44100;
  const sampleCount = Math.min(1024, Math.floor(audioBuffer.length / 2));
  const samples = new Array(sampleCount).fill(0);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = audioBuffer.readInt16LE(i * 2) / 32768;
  }
  const n = sampleCount;
  const re = new Array(n).fill(0);
  const im = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * t * k) / n;
      re[k] += samples[t] * Math.cos(angle);
      im[k] -= samples[t] * Math.sin(angle);
    }
  }
  let totalEnergy = 0;
  let highEnergy = 0;
  const thresholdIndex = Math.floor((20000 / sampleRate) * n);
  for (let k = 0; k < n / 2; k++) {
    const mag = re[k] * re[k] + im[k] * im[k];
    totalEnergy += mag;
    if (k >= thresholdIndex) {
      highEnergy += mag;
    }
  }
  if (totalEnergy === 0) {
    return 0;
  }
  const ratio = highEnergy / totalEnergy;
  return Math.max(0, Math.min(1, ratio));
}

module.exports = { calculateUltrasoundScore };
