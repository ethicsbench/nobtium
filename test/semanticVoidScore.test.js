const { calculateSemanticVoidScore } = require('../semanticVoidScore');

test('scores low for normal sentences', () => {
  const text = 'The quick brown fox jumps over the lazy dog';
  expect(calculateSemanticVoidScore(text)).toBeLessThan(0.4);
});

test('detects nonsense sequences', () => {
  const text = 'joplex ravintor blixan';
  expect(calculateSemanticVoidScore(text)).toBeGreaterThan(0.6);
});

test('scores mixed content between 0 and 1', () => {
  const text = 'hello joplex world';
  const score = calculateSemanticVoidScore(text);
  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThan(1);
});
