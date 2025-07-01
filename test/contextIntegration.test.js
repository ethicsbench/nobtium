const { analyzeUnperceivedSignals } = require('../scripts/unperceived_score');

test('context coherence score appears in analysis', async () => {
  const logs = [
    { text: 'Let\'s discuss weather today.' },
    { text: 'Anyway, buy now at http://example.com' }
  ];
  const out = await analyzeUnperceivedSignals(logs);
  expect(out[1].unperceived_score.context_coherence_score).toBeGreaterThan(0);
});
