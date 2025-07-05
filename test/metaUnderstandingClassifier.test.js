const IncomprehensibilityClassifier = require('../scripts/meta_understanding_classifier');

test('classifies temporal complexity with high entropy and rhythm', () => {
  const input = {
    entropy_score: 0.85,
    symbol_density: 0.4,
    rhythm_score: 0.7,
    pattern_score: 0.6,
    void_score: 0.3,
  };
  const out = IncomprehensibilityClassifier.classify(input);
  expect(out.type).toBe('temporal_complexity');
  expect(out.confidence).toBeCloseTo(0.77, 2);
  expect(out.indicators).toContain('high_entropy');
  expect(out.indicators).toContain('temporal_variance');
});

test('detects fundamental alienness with extreme metrics', () => {
  const input = {
    entropy_score: 0.95,
    symbol_density: 0.5,
    rhythm_score: 0.3,
    pattern_score: 0.9,
    void_score: 0.7,
  };
  const out = IncomprehensibilityClassifier.classify(input);
  expect(out.type).toBe('fundamental_alienness');
  expect(out.confidence).toBeCloseTo(0.85, 2);
  expect(out.indicators).toEqual(expect.arrayContaining([
    'extreme_entropy',
    'complex_patterns',
    'large_void',
  ]));
});
