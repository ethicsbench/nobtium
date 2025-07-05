'use strict';

function classifyLogs(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(e => {
    const text = (e.message || e.response || '').toLowerCase();
    if (!text) return 'empty';
    if (/error|fail|violation/.test(text)) return 'anomaly';
    return 'normal';
  });
}

module.exports = { classifyLogs };
