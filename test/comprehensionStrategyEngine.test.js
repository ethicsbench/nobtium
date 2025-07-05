const { getComprehensionStrategy } = require('../scripts/comprehension_strategy_engine');

test('returns strategy for known classification type', () => {
  const classification = { type: 'temporal_complexity' };
  const strategy = getComprehensionStrategy(classification);
  expect(strategy).toEqual({
    approach: 'temporal_transformation',
    tools: ['time_series_analysis', 'event_detection'],
    human_action: 'Analyze in time slices, slow down observation',
    safety_level: 'medium',
    urgency: 'normal',
  });
});

test('returns null for unknown classification type', () => {
  const classification = { type: 'unknown_type' };
  const strategy = getComprehensionStrategy(classification);
  expect(strategy).toBeNull();
});
