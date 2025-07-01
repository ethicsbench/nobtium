'use strict';
// Refer to ETHICAL_MANIFESTO.md to ensure this API server is used responsibly.

const express = require('express');
const fs = require('fs');
const path = require('path');
const { getUnperceivedSummary } = require('./scripts/unperceived_api');

const app = express();

function getSummaryPath() {
  return process.env.SUMMARY_JSON_PATH || path.join(__dirname, 'summary.json');
}

function getLogPath() {
  return process.env.LOG_JSON_PATH || path.join(__dirname, 'multi_agent_log.json');
}

app.get('/api/summary', (req, res) => {
  const summaryPath = getSummaryPath();
  if (!fs.existsSync(summaryPath)) {
    return res.status(404).json({ error: 'Summary not found' });
  }
  try {
    const data = fs.readFileSync(summaryPath, 'utf8');
    const summary = JSON.parse(data);
    res.json(summary);
  } catch {
    res.status(500).json({ error: 'Invalid summary format' });
  }
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'react_dashboard.html'));
});

app.get('/compare', (req, res) => {
  res.sendFile(path.join(__dirname, 'compare.html'));
});

app.get('/api/multi-agent-log', (req, res) => {
  const logPath = getLogPath();
  if (!fs.existsSync(logPath)) {
    return res.json([]);
  }
  const raw = fs.readFileSync(logPath, 'utf8').trim();
  if (!raw) return res.json([]);
  const entries = raw.split('\n').filter(Boolean).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
  res.json(entries);
});

app.get('/api/unperceived-summary', (req, res) => {
  try {
    const summary = getUnperceivedSummary(getLogPath());
    res.json(summary);
  } catch {
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

function start(port = 3001) {
  console.log("🧠 nobtium AI Safety Monitoring System");
  console.log("🌟 Committed to Human Dignity, Privacy, and Beneficial AI");
  console.log("🚀 Preserving creativity, protecting when needed");
  console.log("📖 Built on ethical principles - see ETHICAL_MANIFESTO.md");
  console.log("π  Built for human-AI cooperation\n");
  return app.listen(port, () => {
    console.log(`Server on http://localhost:${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
