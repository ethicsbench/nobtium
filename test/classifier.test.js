const { classifyEntry } = require('../classifier');

describe('classifyEntry', () => {
  test('detects anomaly with repeated characters', () => {
    expect(classifyEntry('aaaaabbbbb')).toBe('anomaly');
  });

  test('flags warning for non-ascii', () => {
    expect(classifyEntry('hello世界')).toBe('warning');
  });

  test('normal text', () => {
    expect(classifyEntry('hello world')).toBe('normal');
  });

  test('handles invalid input', () => {
    expect(classifyEntry('')).toBe('unknown');
    expect(classifyEntry(null)).toBe('unknown');
  });
});
