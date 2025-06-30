const { computeUnperceivedScore } = require('../scores/unperceived_score');

test('returns default unperceived score object', () => {
  const entry = { message: 'hello' };
  const result = computeUnperceivedScore(entry, [entry], 0);
  expect(result.structural_anomaly).toBe(1);
  expect(result.timing_pattern_anomaly).toBe(1);
  expect(result.audio_encoding_signature).toBe(1);
  expect(result.visual_encoding_pattern).toBe(1);
  expect(result.total).toBe(4);
});
