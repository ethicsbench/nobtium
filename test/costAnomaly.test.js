const { detectCostAnomaly } = require('../costTracker');

test('detects anomaly when cost exceeds threshold', () => {
  expect(detectCostAnomaly(0.5)).toBe('cost_alert');
});

test('ignores cost within threshold', () => {
  expect(detectCostAnomaly(0.1)).toBeNull();
});
