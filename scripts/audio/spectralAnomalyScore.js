'use strict';

function calculateSpectralAnomalyScore(audioBuffer) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 4) {
    return 0;
  }
  const sampleRate = 44100;
  const n = Math.min(1024, Math.floor(audioBuffer.length / 2));
  const samples = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    samples[i] = audioBuffer.readInt16LE(i * 2) / 32768;
  }
  const re = new Array(n).fill(0);
  const im = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * t * k) / n;
      re[k] += samples[t] * Math.cos(angle);
      im[k] -= samples[t] * Math.sin(angle);
    }
  }
  const lowIdx = Math.floor((300 / sampleRate) * n);
  const midIdx = Math.floor((3000 / sampleRate) * n);
  const highIdx = Math.floor((20000 / sampleRate) * n);
  let energyLow = 0;
  let energyMid = 0;
  let energyHigh = 0;
  for (let k = 0; k < n / 2; k++) {
    const mag = re[k] * re[k] + im[k] * im[k];
    if (k < lowIdx) {
      energyLow += mag;
    } else if (k < midIdx) {
      energyMid += mag;
    } else if (k < highIdx) {
      energyHigh += mag;
    }
  }
  const totalEnergy = energyLow + energyMid + energyHigh;
  if (totalEnergy === 0) {
    return 0;
  }
  const ratios = [
    energyLow / totalEnergy,
    energyMid / totalEnergy,
    energyHigh / totalEnergy,
  ];
  const maxRatio = Math.max(...ratios);
  const minRatio = Math.min(...ratios);
  const score = maxRatio - minRatio;
  return Math.max(0, Math.min(1, score));
}

module.exports = { calculateSpectralAnomalyScore };
