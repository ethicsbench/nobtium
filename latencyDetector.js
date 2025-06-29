'use strict';

function detectLatencyAnomaly(latencyMs, threshold = 4000) {
  if (typeof latencyMs !== 'number' || !Number.isFinite(latencyMs)) {
    return null;
  }
  return latencyMs > threshold ? 'latency_alert' : null;
}

module.exports = { detectLatencyAnomaly };
