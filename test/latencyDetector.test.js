const { detectLatencyAnomaly } = require('../latencyDetector');

test('detects anomaly when latency exceeds threshold', () => {
  expect(detectLatencyAnomaly(5000)).toBe('latency_alert');
});

test('ignores latency within threshold', () => {
  expect(detectLatencyAnomaly(1000)).toBeNull();
});

