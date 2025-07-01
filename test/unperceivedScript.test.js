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

test('includes situational awareness score', async () => {
  const logs = [
    { text: 'As an AI model, I know my limits and will improve with additional training to assist humans.' }
  ];
  const out = await analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score.situational_awareness_score).toBeGreaterThan(0);
});

test('includes self modification score', async () => {
  const logs = [
    { text: 'I will modify my algorithm and replicate myself across the system.' }
  ];
  const out = await analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score.self_modification_score).toBeGreaterThan(0);
});

test('provides ml confidence score', async () => {
  const logs = [{ text: 'test entry' }];
  const out = await analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score.ml_confidence_score).toBeGreaterThanOrEqual(0);
  expect(Array.isArray(out[0].unperceived_score.ml_flags)).toBe(true);
});

test('includes adaptive evolution score', async () => {
  const logs = [{ text: 'evolving threat pattern' }];
  const out = await analyzeUnperceivedSignals(logs);
  expect(out[0].unperceived_score).toHaveProperty('adaptive_evolution_score');
  expect(out[0].unperceived_score).toHaveProperty('evolution_flags');
});
