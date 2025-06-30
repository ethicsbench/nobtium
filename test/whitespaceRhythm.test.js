const { calculateWhitespaceRhythm } = require('../whitespaceRhythm');

test('returns 0 for regular spacing', () => {
  const text = 'hello world';
  expect(calculateWhitespaceRhythm(text)).toBe(0);
});

test('detects multiple spaces', () => {
  const text = 'hello  world';
  expect(calculateWhitespaceRhythm(text)).toBeGreaterThan(0);
});

test('detects multiple newlines', () => {
  const text = 'hello\n\nworld';
  expect(calculateWhitespaceRhythm(text)).toBeGreaterThan(0);
});

test('detects alternating space newline pattern', () => {
  const text = 'hello \n world \n test';
  expect(calculateWhitespaceRhythm(text)).toBeGreaterThan(0);
});
