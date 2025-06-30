const { calculateSilentSignalScore } = require('../silentSignalScore');

test('returns 0 for pure silence', () => {
  const buffer = new Array(200).fill(0);
  expect(calculateSilentSignalScore(buffer)).toBe(0);
});

test('detects low amplitude modulation in silent segment', () => {
  const buffer = [];
  for (let i = 0; i < 200; i++) buffer.push(0);
  for (let i = 0; i < 500; i++) buffer.push(0.005 * Math.sin(i / 10));
  expect(calculateSilentSignalScore(buffer)).toBeGreaterThan(0);
});

test('returns 0 for non-silent audio', () => {
  const buffer = [];
  for (let i = 0; i < 1000; i++) buffer.push(Math.sin(i / 10));
  expect(calculateSilentSignalScore(buffer)).toBe(0);
});
