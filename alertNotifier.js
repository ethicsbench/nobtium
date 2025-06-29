'use strict';
const fs = require('fs');
const path = require('path');
const { detectLatencyAnomaly } = require('./latencyDetector');
const { detectCostAnomaly } = require('./costTracker');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    });
  } catch (_) {
    /* ignore */
  }
  return env;
}

async function sendNotification(text) {
  const env = loadEnv();
  const url = env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    } catch (err) {
      console.error('Failed to send Slack notification:', err);
      console.log(text);
    }
  } else {
    console.log(text);
  }
}

function formatMessage(entry, alert) {
  const agent = entry.agent_name || 'unknown';
  const prompt = entry.prompt || '';
  const ts = entry.timestamp || new Date().toISOString();
  return `[${alert}] ${agent} at ${ts}: ${prompt}`;
}

const debounceMap = Object.create(null);
const DEBOUNCE_MS = 60 * 1000;

async function handleEntry(entry) {
  if (!entry || typeof entry !== 'object') return;
  const alerts = [];
  if (typeof entry.latency_ms === 'number') {
    const a = detectLatencyAnomaly(entry.latency_ms);
    if (a) alerts.push(a);
  }
  if (typeof entry.cost_usd === 'number') {
    const a = detectCostAnomaly(entry.cost_usd);
    if (a) alerts.push(a);
  }
  for (const alert of alerts) {
    const key = `${alert}-${entry.agent_name}-${entry.prompt}`;
    const now = Date.now();
    if (debounceMap[key] && now - debounceMap[key] < DEBOUNCE_MS) continue;
    debounceMap[key] = now;
    const msg = formatMessage(entry, alert);
    await sendNotification(msg);
  }
}

async function checkLogsOnce(logPath, errorPath) {
  const paths = [logPath, errorPath].filter(Boolean);
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        await handleEntry(entry);
      } catch (_) {
        /* ignore malformed lines */
      }
    }
  }
}

module.exports = { handleEntry, checkLogsOnce, formatMessage };
