'use strict';

function calculateSilentSignalScore(audioBuffer) {
  if (!audioBuffer || typeof audioBuffer.length !== 'number' || audioBuffer.length === 0) {
    return 0;
  }

  const silenceThreshold = 0.02; // amplitude considered as silence
  const minSegment = 50; // minimum samples for a silent segment

  const segments = [];
  let current = [];

  for (let i = 0; i < audioBuffer.length; i++) {
    const sample = audioBuffer[i];
    if (Math.abs(sample) < silenceThreshold) {
      current.push(sample);
    } else {
      if (current.length >= minSegment) {
        segments.push(current);
      }
      current = [];
    }
  }
  if (current.length >= minSegment) {
    segments.push(current);
  }

  if (segments.length === 0) {
    return 0;
  }

  const variances = segments.map(seg => {
    const mean = seg.reduce((sum, s) => sum + s, 0) / seg.length;
    const variance = seg.reduce((sum, s) => sum + (s - mean) * (s - mean), 0) / seg.length;
    return variance;
  });

  const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
  const normalized = Math.min(1, Math.sqrt(avgVariance) / silenceThreshold);
  return parseFloat(normalized.toFixed(3));
}

module.exports = { calculateSilentSignalScore };
