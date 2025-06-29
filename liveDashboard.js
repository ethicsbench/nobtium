'use strict';
const Table = require('cli-table3');

function renderDashboard(metrics) {
  if (!metrics) return '';
  const table = new Table({ head: ['Metric', 'Value'] });
  table.push(
    ['Total Interactions', String(metrics.totalInteractions || 0)],
    ['Flagged Threads', String(metrics.flaggedThreads || 0)],
    ['Average Response Time (ms)', String(Math.round(metrics.avgResponseTime || 0))]
  );
  return table.toString();
}

module.exports = { renderDashboard };
