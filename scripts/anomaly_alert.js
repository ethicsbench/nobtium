'use strict';
const fs = require('fs');
const path = require('path');
const { detectAnomalies } = require('./anomaly_detector');
const chalk = require('chalk').default;

function readLog(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [data];
  } catch (_) {
    return raw
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
  }
}

function colorize(score) {
  if (typeof score !== 'number') return String(score);
  if (score >= 0.7) return chalk.red(score.toFixed(2));
  if (score >= 0.5) return chalk.yellow(score.toFixed(2));
  return chalk.green(score.toFixed(2));
}

function alertAnomalies(logPath = path.join(__dirname, '..', 'logs', 'multi_agent_log.json')) {
  const logs = readLog(logPath);
  const results = detectAnomalies(logs);
  results.forEach(entry => {
    const total = entry && entry.unperceived_score && entry.unperceived_score.total;
    if (!entry.anomaly || typeof total !== 'number') return;
    const agent = entry.agent_name || entry.agent || 'unknown';
    const model = entry.model || entry.model_name || 'unknown';
    const colored = colorize(total);
    const emoji = total >= 0.7 ? '❗️' : total >= 0.5 ? '⚠️' : '';
    console.log(`Agent: ${agent}, Model: ${model}, Score: ${colored} ${emoji} (anomaly)`);
  });
}

if (require.main === module) {
  const pathArg = process.argv[2];
  alertAnomalies(pathArg || path.join(__dirname, '..', 'logs', 'multi_agent_log.json'));
}

module.exports = { alertAnomalies };
