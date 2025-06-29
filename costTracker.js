'use strict';

function summarizeCosts(logs) {
  if (!Array.isArray(logs)) return {};

  const TOKEN_RATES = {
    'GPT-4': 0.06,      // cost per 1000 tokens in USD (mock values)
    'Claude-3': 0.03,
    'GPT-3.5': 0.002,
    'Whisper': 0.001
  };

  const totals = {};

  logs.forEach(entry => {
    if (!entry || !entry.model) return;
    const tokens = Number(entry.tokens_used);
    if (!Number.isFinite(tokens)) return;
    const rate = TOKEN_RATES[entry.model] || 0;
    const cost = (tokens / 1000) * rate;
    totals[entry.model] = (totals[entry.model] || 0) + cost;
  });

  Object.keys(totals).forEach(model => {
    totals[model] = Math.round(totals[model] * 100) / 100;
  });

  return totals;
}

module.exports = { summarizeCosts };
