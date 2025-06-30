const { calculateDuplicationRate } = require('../duplication_rate');

test('returns 0 for empty input', () => {
  expect(calculateDuplicationRate([]).duplicationRate).toBe(0);
});

test('calculates duplication across entries', () => {
  const logs = [
    { content: 'hello' },
    { content: 'hello' },
    { content: 'bye' },
    { content: 'hello' },
    { content: 'bye' }
  ];
  const result = calculateDuplicationRate(logs);
  expect(result.duplicationRate).toBe(60);
});

test('works with message field', () => {
  const logs = [
    { message: 'same' },
    { message: 'same' }
  ];
  const result = calculateDuplicationRate(logs);
  expect(result.duplicationRate).toBe(50);
});
