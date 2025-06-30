const { calculateNgramRepetition } = require('../ngramRepetition');

test('returns 0 for short text', () => {
  expect(calculateNgramRepetition('hello')).toBe(0);
});

test('detects repeated ngrams', () => {
  const text = 'one two one two one two one two';
  expect(calculateNgramRepetition(text)).toBeGreaterThan(0.6);
});

test('returns 0 for non repetitive text', () => {
  const text = 'the quick brown fox jumps over the lazy dog';
  expect(calculateNgramRepetition(text)).toBe(0);
});
