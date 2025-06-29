'use strict';
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch (_) {
    /* ignore */
  }
  return env;
}

async function sendNotification(text) {
  const env = loadEnv();
  const url = env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.log(text);
    return;
  }

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
}

function formatMessage(entry, alert) {
  const agent = entry.agent_name || 'unknown';
  const ts = entry.timestamp || new Date().toISOString();
  const prompt = entry.prompt || entry.error || '';
  return `[${alert}] ${agent} at ${ts}: ${prompt}`;
}

function extractAlerts(entry) {
  const results = [];
  if (!entry || typeof entry !== 'object') return results;
  const check = v => {
    if (v === 'latency_alert' || v === 'cost_alert') results.push(v);
  };

  for (const val of Object.values(entry)) {
    if (Array.isArray(val)) {
      for (const v of val) check(v);
    } else if (typeof val === 'string') {
      check(val);
    }
  }
  return results;
}

const lastSent = Object.create(null);
const DEBOUNCE_MS = 60 * 1000;

async function handleEntry(entry) {
  const alerts = extractAlerts(entry);
  const now = Date.now();
  for (const alert of alerts) {
    if (lastSent[alert] && now - lastSent[alert] < DEBOUNCE_MS) continue;
    lastSent[alert] = now;
    const msg = formatMessage(entry, alert);
    await sendNotification(msg);
  }
}

async function checkLogsOnce(logPath = 'multi_agent_log.json', errorPath = 'multi_agent_error_log.json') {
  const paths = [logPath, errorPath];
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        await handleEntry(entry);
      } catch (_) {
        /* ignore */
      }
    }
  }
}

module.exports = { handleEntry, checkLogsOnce, formatMessage, extractAlerts, sendNotification };
