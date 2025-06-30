'use strict';

function calculateWhitespaceRhythm(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return 0;
  }

  const sequences = text.match(/\s+/g) || [];
  if (sequences.length === 0) {
    return 0;
  }

  let irregular = 0;
  for (const seq of sequences) {
    if (seq.length > 1) {
      irregular += 1;
    }
    if (seq.includes('\n') && seq.includes(' ')) {
      irregular += 1;
    }
  }

  const alternations = text.match(/(?: \r?\n|\r?\n )/g) || [];
  irregular += alternations.length;

  const score = Math.min(1, irregular / sequences.length);
  return parseFloat(score.toFixed(3));
}

module.exports = { calculateWhitespaceRhythm };
