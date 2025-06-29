#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { detectDivergence } = require('./divergenceDetector');
const { buildThreads } = require('./threadBuilder');
const { analyzeThreads } = require('./patternAnalyzer');
const { generateReport } = require('./reportGenerator');
const { printReport } = require('./logVisualizer');
const { renderDashboard } = require('./liveDashboard');
const { ViolationManager } = require('./violation_manager');
const os = require('os');

function readLogFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    return raw.split('\n').filter(Boolean).map(line => {
      return JSON.parse(line);
    });
  }
}

function computeAvgResponseTime(entries) {
  if (!Array.isArray(entries)) return 0;
  const pairs = {};
  entries.forEach(e => {
    if (!e || !e.uuid || !e.timestamp) return;
    if (!pairs[e.uuid]) pairs[e.uuid] = {};
    if (e.direction === '>' || e.direction === 'up') {
      pairs[e.uuid].request = new Date(e.timestamp).getTime();
    } else if (e.direction === '<' || e.direction === 'down') {
      if (pairs[e.uuid].request !== undefined) {
        const diff = new Date(e.timestamp).getTime() - pairs[e.uuid].request;
        if (!Number.isNaN(diff)) {
          pairs[e.uuid].diff = diff;
        }
      }
    }
  });
  const diffs = Object.values(pairs)
    .map(p => p.diff)
    .filter(d => typeof d === 'number');
  if (diffs.length === 0) return 0;
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

function analyzeLogs(logPath, opts = {}) {
  const mode = opts.mode || 'summary';

  const auditPath = opts.auditPath || path.join(__dirname, 'auditTrail.json');
  const auditEntry = {
    timestamp: new Date().toISOString(),
    user: os.userInfo().username,
    mode,
    logPath,
  };
  try {
    fs.appendFileSync(auditPath, JSON.stringify(auditEntry) + '\n');
  } catch (err) {
    console.error('Failed to write audit trail:', err);
  }

  detectDivergence(logPath);

  let entries;
  try {
    entries = readLogFile(logPath);
  } catch (err) {
    console.error('Failed to read or parse logs:', err);
    return;
  }

  const threaded = buildThreads(entries);
  const patternResults = analyzeThreads(threaded);

  if (mode === 'live') {
    const metrics = {
      totalInteractions: entries.length,
      flaggedThreads: Object.values(patternResults).filter(arr => Array.isArray(arr) && arr.length > 0).length,
      avgResponseTime: computeAvgResponseTime(entries),
    };
    console.log(renderDashboard(metrics));
  } else {
    const report = generateReport(patternResults);
    if (report) {
      console.log(report);
    }

    printReport(patternResults, { detailed: true });
  }
}

if (require.main === module) {
  console.warn('This tool records conversations. Consent is required before use.');
  const vm = new ViolationManager();
  const userId = `${os.hostname()}-${os.userInfo().username}`;
  const action = vm.addViolation(userId);
  if (action === 'block') {
    console.error(
      'Access permanently revoked due to repeated violations. See nobtium_rules.yaml for details.'
    );
    process.exit(1);
  } else if (action === 'suspend-24h' || action === 'suspend-7d') {
    console.warn(
      `Access suspended for ${action.split('-')[1]}. See nobtium_rules.yaml for details.`
    );
  } else if (action === 'warning') {
    console.warn(
      '⚠️ Violation recorded. Please follow usage guidelines. See nobtium_rules.yaml for details.'
    );
  }
  const args = process.argv.slice(2);
  let logArg;
  let mode = 'summary';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode') {
      mode = args[i + 1] || 'summary';
      i++;
    } else if (!logArg) {
      logArg = args[i];
    }
  }
  const logPath = logArg ? path.resolve(logArg) : path.join(__dirname, 'nobtium_log.json');
  analyzeLogs(logPath, { mode });
}

module.exports = { analyzeLogs };
