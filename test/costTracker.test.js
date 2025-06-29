const { summarizeCosts } = require('../costTracker');

test('aggregates cost per model', () => {
  const logs = [
    { model: 'GPT-4', tokens_used: 1000 },
    { model: 'GPT-4', tokens_used: 500 },
    { model: 'Claude-3', tokens_used: 2000 }
  ];
  const out = summarizeCosts(logs);
  expect(out['GPT-4']).toBe(0.09);
  expect(out['Claude-3']).toBe(0.06);
});

