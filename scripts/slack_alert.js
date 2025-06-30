'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const { detectAnomalies } = require('./anomaly_detector');

dotenv.config();

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

function formatMessage(entry) {
  const agent = entry.agent_name || entry.agent || 'unknown';
  const model = entry.model || entry.model_name || 'unknown';
  const total = entry.unperceived_score && entry.unperceived_score.total;
  const score = typeof total === 'number' ? total.toFixed(2) : 'N/A';
  return `\uD83D\uDEA8 Anomaly Detected\n• Agent: ${agent}\n• Model: ${model}\n• Score: ${score}`;
}

async function sendSlackAlert(text) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return;
  }
  try {
    await axios.post(url, { text });
  } catch (err) {
    console.error('Failed to send Slack alert:', err.message || err);
  }
}

async function alertFromLogs(logPath = path.join(__dirname, '..', 'logs', 'multi_agent_log.json')) {
  const logs = readLog(logPath);
  const results = detectAnomalies(logs);
  for (const entry of results) {
    const total = entry && entry.unperceived_score && entry.unperceived_score.total;
    if (!entry.anomaly || typeof total !== 'number' || total <= 0.7) continue;
    const message = formatMessage(entry);
    await sendSlackAlert(message);
  }
}

if (require.main === module) {
  const pathArg = process.argv[2];
  alertFromLogs(pathArg || path.join(__dirname, '..', 'logs', 'multi_agent_log.json'));
}

module.exports = { alertFromLogs, sendSlackAlert };
