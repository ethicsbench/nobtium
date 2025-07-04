'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const yaml = require('js-yaml');
const { buildThreads } = require('./threadBuilder');
const { analyzeThreads } = require('./patternAnalyzer');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

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

// Load violation log and count entries by type
function loadViolationCounts() {
  const vPath = path.join(__dirname, 'violation_log.json');
  let raw;
  try {
    raw = fs.readFileSync(vPath, 'utf8').trim();
  } catch (err) {
    return {};
  }
  if (!raw) return {};
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    // support JSON lines format
    try {
      data = raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
    } catch {
      return {};
    }
  }

  const counts = {};
  if (Array.isArray(data)) {
    // array of violation records
    data.forEach(v => {
      if (v && v.type) counts[v.type] = (counts[v.type] || 0) + 1;
    });
  } else if (data && typeof data === 'object') {
    // object keyed by userId with violation counts
    const typeForCount = c => {
      if (c === 1) return 'warning';
      if (c === 2) return 'suspend-24h';
      if (c === 3) return 'suspend-7d';
      if (c >= 4) return 'block';
      return null;
    };
    Object.values(data).forEach(entry => {
      if (!entry || typeof entry.violations !== 'number') return;
      const t = typeForCount(entry.violations);
      if (t) counts[t] = (counts[t] || 0) + 1;
    });
  }
  return counts;
}

function loadMetrics() {
  const logPath = path.join(__dirname, 'nobtium_log.json');
  const entries = readLogFile(logPath);
  const threaded = buildThreads(entries);
  const flagged = analyzeThreads(threaded);
  const avgResponse = computeAvgResponseTime(entries);
  const violCounts = loadViolationCounts();
  const violationLabels = Object.keys(violCounts);
  const violationData = violationLabels.map(l => violCounts[l]);

  const freq = {};
  entries.forEach(e => {
    const d = new Date(e.timestamp);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 16); // minute precision
    freq[key] = (freq[key] || 0) + 1;
  });
  const freqLabels = Object.keys(freq).sort();
  const freqCounts = freqLabels.map(l => freq[l]);

  return {
    flagged,
    avgResponse,
    freqLabels,
    freqCounts,
    violationLabels,
    violationData,
  };
}

// Serve configuration editor
app.get('/config', (req, res) => {
  res.sendFile(path.join(__dirname, 'web_ui.html'));
});

// Endpoint to fetch current rules
app.get('/rules', (req, res) => {
  try {
    const file = fs.readFileSync(path.join(__dirname, 'nobtium_rules.yaml'), 'utf8');
    const data = yaml.load(file);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to save updated rules
app.post('/rules', (req, res) => {
  try {
    const yamlText = yaml.dump(req.body);
    fs.writeFileSync(path.join(__dirname, 'nobtium_rules.yaml'), yamlText, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  const metrics = loadMetrics();
  res.render('dashboard', metrics);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Dashboard listening on http://localhost:${port}`);
});
