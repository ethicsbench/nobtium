const { calculateAudioEntropyScore } = require('../audioEntropy');

test('scores low for periodic signal', () => {
  const length = 128;
  const freq = 5;
  const sampleRate = 128;
  const buffer = Array.from({ length }, (_, n) =>
    Math.sin((2 * Math.PI * freq * n) / sampleRate)
  );
  expect(calculateAudioEntropyScore(buffer)).toBeLessThan(0.5);
});

test('scores high for noisy signal', () => {
  const length = 128;
  const buffer = Array.from({ length }, () => Math.random() * 2 - 1);
  expect(calculateAudioEntropyScore(buffer)).toBeGreaterThan(0.7);
});

test('score remains between 0 and 1', () => {
  const length = 64;
  const buffer = Array(length).fill(0);
  const score = calculateAudioEntropyScore(buffer);
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(1);
});
