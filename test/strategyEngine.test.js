const { chooseStrategy } = require('../strategyEngine');

describe('chooseStrategy', () => {
  test('returns strict for anomaly', () => {
    expect(chooseStrategy('anomaly')).toBe('strict');
  });

  test('returns medium for warning', () => {
    expect(chooseStrategy('warning')).toBe('medium');
  });

  test('returns basic for normal', () => {
    expect(chooseStrategy('normal')).toBe('basic');
  });

  test('unknown classification', () => {
    expect(chooseStrategy('other')).toBe('unknown');
  });
});
