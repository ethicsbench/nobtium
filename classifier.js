'use strict';

function classifyEntry(message) {
  if (typeof message !== 'string' || !message.trim()) {
    return 'unknown';
  }
  if (/(.)\1{4,}/.test(message)) {
    return 'anomaly';
  }
  if (/[^\x00-\x7F]/.test(message)) {
    return 'warning';
  }
  return 'normal';
}

module.exports = { classifyEntry };
