const { chooseStrategy } = require('../strategyEngine');

describe('chooseStrategy', () => {
  test('returns data_reduction for quantitative complexity', () => {
    const classification = { type: 'quantitative_complexity' };
    expect(chooseStrategy(classification)).toBe('data_reduction');
  });

  test('returns temporal_transformation for temporal complexity', () => {
    const classification = { type: 'temporal_complexity' };
    expect(chooseStrategy(classification)).toBe('temporal_transformation');
  });

  test('returns analogical_bridge for conceptual divergence', () => {
    const classification = { type: 'conceptual_divergence' };
    expect(chooseStrategy(classification)).toBe('analogical_bridge');
  });

  test('returns safe_observation for fundamental alienness', () => {
    const classification = { type: 'fundamental_alienness' };
    expect(chooseStrategy(classification)).toBe('safe_observation');
  });

  test('unknown classification', () => {
    const classification = { type: 'other' };
    expect(chooseStrategy(classification)).toBe('unknown');
  });
});
