const { analyzeThreads } = require('../patternAnalyzer');

test('flags repetition and rapid-fire within a thread', () => {
  const entries = [
    { threadId: 't1', timestamp: '2023-01-01T00:00:00Z', message: 'hi', intent: 'smalltalk' },
    { threadId: 't1', timestamp: '2023-01-01T00:00:01Z', message: 'hi', intent: 'smalltalk' },
    { threadId: 't1', timestamp: '2023-01-01T00:00:02Z', message: 'hi', intent: 'smalltalk' },
  ];
  const result = analyzeThreads(entries);
  expect(result['t1']).toContain('repetition');
  expect(result['t1']).toContain('rapid-fire');
});

test('returns empty object for invalid input', () => {
  expect(analyzeThreads(null)).toEqual({});
});
