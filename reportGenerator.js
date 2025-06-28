'use strict';

function generateReport(patternResults) {
  if (!patternResults || typeof patternResults !== 'object') {
    return '';
  }

  const lines = [];

  Object.keys(patternResults).forEach(threadId => {
    const flags = patternResults[threadId];
    if (Array.isArray(flags) && flags.length > 0) {
      lines.push(`Thread ${threadId} flagged for: ${flags.join(', ')}`);
    }
  });

  if (lines.length === 0) {
    return 'No flagged threads.';
  }

  return lines.join('\n');
}

module.exports = { generateReport };

