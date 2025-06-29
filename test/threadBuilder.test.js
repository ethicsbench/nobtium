const { buildThreads } = require('../threadBuilder');

test('assigns thread IDs based on uuid and timing', () => {
  const entries = [
    { uuid: 'a', timestamp: '2023-01-01T00:00:00Z', intent: 'question' },
    { uuid: 'a', timestamp: '2023-01-01T00:00:03Z', intent: 'question' },
    { uuid: 'a', timestamp: '2023-01-01T00:00:07Z', intent: 'question' },
  ];
  const threaded = buildThreads(entries);
  expect(threaded[0].threadId).toBe('thread-1');
  expect(threaded[1].threadId).toBe('thread-1');
  expect(threaded[2].threadId).toBe('thread-1');
});

test('returns empty array for invalid input', () => {
  expect(buildThreads(null)).toEqual([]);
});
