const { analyzeEntry } = require('../metaWorkflow');

describe('analyzeEntry integration', () => {
  test('returns classification, strategy, and score', () => {
    const entry = { message: 'hello world' };
    const out = analyzeEntry(entry);
    expect(out.classification).toBe('normal');
    expect(out.strategy).toBe('basic');
    expect(out.score).toBe(0);
  });

  test('handles anomaly path', () => {
    const entry = { message: '!!!!!?????' };
    const out = analyzeEntry(entry);
    expect(out.classification).toBe('anomaly');
    expect(out.strategy).toBe('strict');
    expect(out.score).toBe(1);
  });
});
