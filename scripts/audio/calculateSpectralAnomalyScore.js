/**
 * Calculates the anomaly score for a given audio buffer by detecting
 * frequency concentration in narrow bands (e.g., 18–22kHz or <100Hz).
 * 
 * @param {Float32Array} audioBuffer - Array of PCM samples.
 * @param {number} sampleRate - Sampling rate in Hz (e.g., 44100)
 * @returns {number} Spectral anomaly score (0: normal, 1: highly concentrated)
 */

const FFT = require('fft-js').fft;
const FFTUtils = require('fft-js').util;

function calculateSpectralAnomalyScore(audioBuffer, sampleRate) {
  if (!(audioBuffer instanceof Float32Array) || audioBuffer.length === 0) {
    throw new Error('Invalid audio buffer supplied');
  }

  const fftSize = 2048;
  const slice = audioBuffer.slice(0, fftSize);
  const phasors = FFT(slice);
  const magnitudes = FFTUtils.fftMag(phasors);

  const freqStep = sampleRate / fftSize;

  let lowBandEnergy = 0;
  let highBandEnergy = 0;
  let totalEnergy = 0;

  for (let i = 0; i < magnitudes.length; i++) {
    const freq = i * freqStep;
    const mag = magnitudes[i];
    totalEnergy += mag;

    if (freq < 100) {
      lowBandEnergy += mag;
    } else if (freq >= 18000 && freq <= 22000) {
      highBandEnergy += mag;
    }
  }

  const anomalyRatio = (lowBandEnergy + highBandEnergy) / totalEnergy;
  return Math.min(1, parseFloat(anomalyRatio.toFixed(3)));
}

module.exports = { calculateSpectralAnomalyScore };
