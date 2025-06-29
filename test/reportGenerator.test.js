const { generateReport } = require('../reportGenerator');

test('generates human readable report', () => {
  const res = generateReport({ t1: ['repetition', 'rapid-fire'] });
  expect(res.trim()).toBe('Thread t1 flagged for: repetition, rapid-fire');
});

test('returns default message when no flags', () => {
  const res = generateReport({});
  expect(res).toBe('No flagged threads.');
});
