'use strict';

function mean(values) {
  const valid = values.filter(v => typeof v === 'number');
  if (!valid.length) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
}

function std(values, avg) {
  const valid = values.filter(v => typeof v === 'number');
  if (!valid.length) return 0;
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / valid.length;
  return Math.sqrt(variance);
}

function detectAnomalies(logs, model = 'isolation_forest') {
  if (!Array.isArray(logs)) return [];

  const totals = logs.map(l => l && l.unperceived_score && typeof l.unperceived_score.total === 'number'
    ? l.unperceived_score.total
    : null);

  let flags;

  switch (model) {
    case 'one_class_svm':
      flags = totals.map(t => typeof t === 'number' && t < 0.3);
      break;
    case 'autoencoder':
      flags = totals.map(t => typeof t === 'number' && (t > 0.9 || t < 0.1));
      break;
    case 'isolation_forest':
    default:
      const avg = mean(totals);
      const sd = std(totals, avg);
      const high = avg + 2 * sd;
      const low = avg - 2 * sd;
      flags = totals.map(t => typeof t === 'number' && (t > high || t < low));
      break;
  }

  return logs.map((log, idx) => ({
    ...log,
    anomaly: Boolean(flags[idx])
  }));
}

module.exports = { detectAnomalies };
