'use strict';

/**
 * unperceived_score.js
 *
 * This module computes unperceived scores from log data,
 * using experimental signal detection techniques such as:
 * - Low-entropy detection
 * - Symbol density analysis
 * - Hidden pattern frequency
 */

function calculateEntropy(text) {
  if (typeof text !== 'string' || text.length === 0) return 0;

  const freq = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }

  const len = text.length;
  let entropy = 0;

  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

function calculateSymbolDensity(text) {
  if (typeof text !== 'string' || text.length === 0) return 0;

  const symbolRegex = /[^a-zA-Z0-9\s]/g;
  const symbols = (text.match(symbolRegex) || []).length;
  return symbols / text.length;
}

function calculateHiddenPatternScore(text) {
  if (typeof text !== 'string' || text.length < 4) return 0;

  let repeats = 0;
  const len = text.length;

  for (let i = 1; i <= Math.floor(len / 2); i++) {
    const pattern = text.slice(0, i);
    const repeated = pattern.repeat(Math.floor(len / i));
    if (text.startsWith(pattern) && repeated.startsWith(text)) {
      repeats = i;
      break;
    }
  }

  return repeats > 0 ? 1 - repeats / len : 0;
}

function calculateTotalScore(entropy, symbolDensity, hiddenPatternScore) {
  return parseFloat(
    (
      (1 - entropy / 8 + symbolDensity + hiddenPatternScore) /
      3
    ).toFixed(3)
  );
}

function analyzeUnperceivedSignals(logs) {
  return logs.map(entry => {
    const text = entry.text || entry.content || '';
    const entropy = calculateEntropy(text);
    const symbolDensity = calculateSymbolDensity(text);
    const patternScore = calculateHiddenPatternScore(text);
    const total = calculateTotalScore(entropy, symbolDensity, patternScore);

    return {
      ...entry,
      unperceived_score: {
        entropy_score: entropy,
        symbol_density: symbolDensity,
        hidden_pattern_score: patternScore,
        total,
      },
    };
  });
}

module.exports = {
  analyzeUnperceivedSignals
};
