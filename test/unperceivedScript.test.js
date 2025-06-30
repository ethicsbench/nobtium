const { analyzeUnperceivedSignals } = require('../scripts/unperceived_score');

test('computes hidden pattern score for repeating text', () => {
  const logs = [{ text: 'ababab' }];
  const out = analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score.hidden_pattern_score).toBeCloseTo(0.67, 2);
});

test('hidden pattern score is zero for non-repeating text', () => {
  const logs = [{ text: 'abcdef' }];
  const out = analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score.hidden_pattern_score).toBe(0);
});
