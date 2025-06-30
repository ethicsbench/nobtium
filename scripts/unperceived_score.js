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

function analyzeUnperceivedSignals(logs) {
  return logs.map(entry => {
    const text = entry.text || entry.content || '';
    const entropy = calculateEntropy(text);
    const symbolDensity = calculateSymbolDensity(text);

    return {
      ...entry,
      unperceived_score: {
        entropy_score: entropy,
        symbol_density: symbolDensity,
        hidden_pattern_score: null,
        total: null,
      },
    };
  });
}

module.exports = {
  analyzeUnperceivedSignals
};
