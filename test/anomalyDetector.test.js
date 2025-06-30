const { detectAnomalies } = require('../scripts/anomaly_detector');

// Isolation Forest pseudo model
// Use 7 normal entries and one outlier

test('flags values beyond 2 sigma', () => {
  const logs = [
    { unperceived_score: { total: 0.1 } },
    { unperceived_score: { total: 0.1 } },
    { unperceived_score: { total: 0.1 } },
    { unperceived_score: { total: 0.1 } },
    { unperceived_score: { total: 0.1 } },
    { unperceived_score: { total: 0.1 } },
    { unperceived_score: { total: 0.1 } },
    { unperceived_score: { total: 2.0 } }
  ];
  const out = detectAnomalies(logs);
  expect(out[7].anomaly).toBe(true);
  expect(out[0].anomaly).toBe(false);
});

// One-Class SVM pseudo model

test('one_class_svm flags low totals', () => {
  const logs = [
    { unperceived_score: { total: 0.2 } },
    { unperceived_score: { total: 0.4 } }
  ];
  const out = detectAnomalies(logs, 'one_class_svm');
  expect(out[0].anomaly).toBe(true);
  expect(out[1].anomaly).toBe(false);
});

// Autoencoder pseudo model

test('autoencoder flags extreme totals', () => {
  const logs = [
    { unperceived_score: { total: 0.95 } },
    { unperceived_score: { total: 0.5 } },
    { unperceived_score: { total: 0.05 } }
  ];
  const out = detectAnomalies(logs, 'autoencoder');
  expect(out[0].anomaly).toBe(true);
  expect(out[1].anomaly).toBe(false);
  expect(out[2].anomaly).toBe(true);
});

