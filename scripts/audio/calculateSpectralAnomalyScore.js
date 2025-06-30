"use strict";

/**
 * Calculates the anomaly score for a given audio buffer by detecting
 * frequency concentration in narrow bands (e.g., 18–22kHz or <100Hz).
 *
 * @param {Buffer} audioBuffer - PCM audio buffer.
 * @param {number} [sampleRate=44100] - Sampling rate in Hz (e.g., 44100)
 * @returns {number} Spectral anomaly score (0: normal, 1: highly concentrated)
 */

// This implementation avoids external FFT dependencies by using a naive
// Discrete Fourier Transform. It is slower than an optimized FFT but keeps
// the code self-contained.

function calculateSpectralAnomalyScore(audioBuffer, sampleRate = 44100) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 4) {
    return 0;
  }
  if (typeof sampleRate !== "number" || sampleRate <= 0) {
    sampleRate = 44100;
  }

  const n = Math.min(2048, Math.floor(audioBuffer.length / 2));
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

  const freqStep = sampleRate / n;
  let lowBandEnergy = 0;
  let highBandEnergy = 0;
  let totalEnergy = 0;
  const half = Math.floor(n / 2);

  for (let k = 0; k < half; k++) {
    const freq = k * freqStep;
    const mag = re[k] * re[k] + im[k] * im[k];
    totalEnergy += mag;

    if (freq < 100) {
      lowBandEnergy += mag;
    } else if (freq >= 18000 && freq <= 22000) {
      highBandEnergy += mag;
    }
  }

  if (totalEnergy === 0) {
    return 0;
  }

  const anomalyRatio = (lowBandEnergy + highBandEnergy) / totalEnergy;
  return Math.min(1, parseFloat(anomalyRatio.toFixed(3)));
}

module.exports = { calculateSpectralAnomalyScore };
