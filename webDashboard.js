'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const { buildThreads } = require('./threadBuilder');
const { analyzeThreads } = require('./patternAnalyzer');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function readLogFile(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8').trim();
  } catch (err) {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
  }
}

function computeAvgResponseTime(entries) {
  const pairs = {};
  entries.forEach(e => {
    if (!e || !e.uuid || !e.timestamp) return;
    if (!pairs[e.uuid]) pairs[e.uuid] = {};
    const ts = new Date(e.timestamp).getTime();
    if (e.direction === '>' || e.direction === 'up') {
      pairs[e.uuid].request = ts;
    } else if (e.direction === '<' || e.direction === 'down') {
      if (pairs[e.uuid].request !== undefined) {
        const diff = ts - pairs[e.uuid].request;
        if (!Number.isNaN(diff)) pairs[e.uuid].diff = diff;
      }
    }
  });
  const diffs = Object.values(pairs)
    .map(p => p.diff)
    .filter(d => typeof d === 'number');
  if (diffs.length === 0) return 0;
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

function loadMetrics() {
  const logPath = path.join(__dirname, 'saplog.json');
  const entries = readLogFile(logPath);
  const threaded = buildThreads(entries);
  const flagged = analyzeThreads(threaded);
  const avgResponse = computeAvgResponseTime(entries);

  const freq = {};
  entries.forEach(e => {
    const d = new Date(e.timestamp);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 16); // minute precision
    freq[key] = (freq[key] || 0) + 1;
  });
  const freqLabels = Object.keys(freq).sort();
  const freqCounts = freqLabels.map(l => freq[l]);

  return { flagged, avgResponse, freqLabels, freqCounts };
}

app.get('/', (req, res) => {
  const metrics = loadMetrics();
  res.render('dashboard', metrics);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Dashboard listening on http://localhost:${port}`);
});
