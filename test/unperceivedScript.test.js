const { analyzeUnperceivedSignals } = require('../scripts/unperceived_score');

test('computes hidden pattern score for repeating text', async () => {
  const logs = [{ text: 'ababab' }];
  const out = await analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score.hidden_pattern_score).toBeCloseTo(0.67, 2);
  expect(out[0].unperceived_score.total).toBeCloseTo(0.45, 2);
});

test('hidden pattern score is zero for non-repeating text', async () => {
  const logs = [{ text: 'abcdef' }];
  const out = await analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score.hidden_pattern_score).toBe(0);
  expect(out[0].unperceived_score.total).toBeCloseTo(0.271, 3);
});
