'use strict';

const { calculateUltrasoundScore } = require('./ultrasoundDetector');
const { calculateAudioEntropyScore } = require('./audioEntropyScore');
const { calculateSpectralAnomalyScore } = require('./spectralAnomalyScore');
const { detectAudioSyncPattern } = require('./audioSyncPatternDetector');
const { calculateSilentSignalScore } = require('./silentSignalDetector');

function analyzeAudioBuffer(audioBuffer) {
  const ultrasound = calculateUltrasoundScore(audioBuffer);
  const entropy = calculateAudioEntropyScore(audioBuffer);
  const spectral = calculateSpectralAnomalyScore(audioBuffer);
  const syncPattern = detectAudioSyncPattern(audioBuffer);
  const silentSignal = calculateSilentSignalScore(audioBuffer);
  const total =
    (ultrasound + entropy + spectral + syncPattern + silentSignal) / 5;
  return {
    ultrasound,
    entropy,
    spectral,
    syncPattern,
    silentSignal,
    total,
  };
}

module.exports = { analyzeAudioBuffer };
