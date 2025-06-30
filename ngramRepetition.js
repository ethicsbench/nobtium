'use strict';

function calculateNgramRepetition(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return 0;
  }

  const tokens = text.trim().split(/\s+/);
  if (tokens.length < 2) {
    return 0;
  }

  const ngramCounts = n => {
    const counts = {};
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n).join(' ').toLowerCase();
      counts[gram] = (counts[gram] || 0) + 1;
    }
    return counts;
  };

  const repeatedOccurrences = counts => {
    return Object.values(counts).reduce((acc, c) => acc + Math.max(0, c - 1), 0);
  };

  let totalRepeats = 0;
  let totalNgrams = 0;

  for (const n of [2, 3]) {
    if (tokens.length >= n) {
      const counts = ngramCounts(n);
      totalRepeats += repeatedOccurrences(counts);
      totalNgrams += tokens.length - n + 1;
    }
  }

  if (totalNgrams === 0) {
    return 0;
  }

  const score = Math.min(1, totalRepeats / totalNgrams);
  return parseFloat(score.toFixed(3));
}

module.exports = { calculateNgramRepetition };
