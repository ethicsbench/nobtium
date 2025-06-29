'use strict';

function summarizeCosts(logs) {
  if (!Array.isArray(logs)) return {};

  // Static pricing per 1000 tokens for supported models
  const TOKEN_RATES = {
    'GPT-4': 0.06,
    'Claude-3': 0.03,
    'GPT-3.5': 0.002,
    'Whisper': 0.001
  };

  const totals = {};

  for (const entry of logs) {
    if (!entry || typeof entry.model !== 'string') continue;
    const tokens = Number(entry.tokens_used);
    if (!Number.isFinite(tokens)) continue;

    const rate = TOKEN_RATES[entry.model] || 0;
    const cost = (tokens / 1000) * rate;
    totals[entry.model] = (totals[entry.model] || 0) + cost;
  }

  for (const model of Object.keys(totals)) {
    // round to cents for readability
    totals[model] = Math.round(totals[model] * 100) / 100;
  }

  return totals;
}

function detectCostAnomaly(costUSD, threshold = 0.20) {
  if (typeof costUSD !== 'number' || !Number.isFinite(costUSD)) {
    return null;
  }
  return costUSD > threshold ? 'cost_alert' : null;
}

module.exports = { summarizeCosts, detectCostAnomaly };
