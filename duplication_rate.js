'use strict';

function calculateDuplicationRate(logs) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { duplicationRate: 0 };
  }

  const counts = new Map();
  for (const entry of logs) {
    if (!entry) continue;
    const text = entry.content || entry.message || entry.response;
    if (typeof text !== 'string') continue;
    const normalized = text.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { duplicationRate: 0 };
  }

  let duplicates = 0;
  for (const c of counts.values()) {
    if (c > 1) duplicates += c - 1;
  }

  const rate = (duplicates / total) * 100;
  return { duplicationRate: parseFloat(rate.toFixed(1)) };
}

module.exports = { calculateDuplicationRate };
