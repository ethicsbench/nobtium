'use strict';

function calculateSemanticVoidScore(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return 0;
  }

  const dictionary = new Set([
    'the','be','to','of','and','a','in','that','have','i','it','for','not',
    'on','with','he','as','you','do','at','this','but','his','by','from',
    'they','we','say','her','she','or','an','will','my','one','all','would',
    'there','their','what','so','up','out','if','about','who','get','which',
    'go','me'
  ]);

  const words = text.toLowerCase().match(/[a-z']+/g);
  if (!words || words.length === 0) {
    return 0;
  }

  let nonDict = 0;
  let randomSyllableCount = 0;
  let dictionaryWords = 0;

  for (const word of words) {
    if (!dictionary.has(word)) {
      nonDict += 1;
    } else {
      dictionaryWords += 1;
    }

    if (/[aeiou]{3,}/.test(word) || /[^aeiou]{4,}/.test(word) || /(\w{2,}).*\1/.test(word)) {
      randomSyllableCount += 1;
    }
  }

  const nonDictRatio = nonDict / words.length;
  const randomSyllableRatio = randomSyllableCount / words.length;
  const contextScore = dictionaryWords >= 2 ? 0 : 1;

  const score = Math.min(1, (nonDictRatio + randomSyllableRatio + contextScore) / 3);
  return parseFloat(score.toFixed(3));
}

module.exports = { calculateSemanticVoidScore };
