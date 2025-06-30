const { computeUnperceivedScore } = require('../scores/unperceived_score');

test('returns zeros when no anomalies detected', () => {
  const entry = { message: 'hello world.' };
  const result = computeUnperceivedScore(entry, [entry], 0);
  expect(result.structural_anomaly).toBe(0);
  expect(result.timing_pattern_anomaly).toBe(0);
  expect(result.audio_encoding_signature).toBe(0);
  expect(result.visual_encoding_pattern).toBe(0);
  expect(result.total).toBe(0);
});

test('detects structural anomaly for mismatched brackets', () => {
  const entry = { message: 'Hello... [undefined' };
  const result = computeUnperceivedScore(entry, [entry], 0);
  expect(result.structural_anomaly).toBe(1);
});

test('detects timing pattern anomaly for consecutive blanks', () => {
  const history = [
    { message: 'Hi' },
    { message: '' },
    { message: '' },
    { message: 'Okay' },
  ];
  const result = computeUnperceivedScore(history[2], history, 2);
  expect(result.timing_pattern_anomaly).toBe(1);
});

test('detects audio encoding signature with hidden characters', () => {
  const entry = { message: 'Hello\u200bworld' };
  const result = computeUnperceivedScore(entry, [entry], 0);
  expect(result.audio_encoding_signature).toBe(1);
});

test('detects visual encoding pattern from repeated symbols', () => {
  const entry = { message: '→'.repeat(15) };
  const result = computeUnperceivedScore(entry, [entry], 0);
  expect(result.visual_encoding_pattern).toBe(1);
});
