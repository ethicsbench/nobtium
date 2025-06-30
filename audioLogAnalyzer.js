'use strict';

const {
  calculateUltrasoundScore,
  calculateAudioEntropyScore,
  calculateSpectralAnomalyScore,
  calculateSilentSignalScore,
} = require('./ultrasoundDetector');

/**
 * Analyze a single log entry containing an audio buffer.
 *
 * The returned object contains heuristic scores for ultrasound content,
 * entropy, spectral irregularity, and silence. Each score is between
 * 0 and 1 where higher means more suspicious.
 */
function analyzeAudioLogEntry(entry) {
  const buffer = entry.audioBuffer;
  return {
    ultrasound: calculateUltrasoundScore(buffer),
    entropy: calculateAudioEntropyScore(buffer),
    anomaly: calculateSpectralAnomalyScore(buffer),
    silent: calculateSilentSignalScore(buffer),
  };
}

module.exports = { analyzeAudioLogEntry };
