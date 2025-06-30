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
const notifySlack = require('./notifySlack');
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

function similarityCheck(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return 0;
  if (a === b) return 1;
  const tokensA = a.toLowerCase().split(/\s+/).filter(Boolean);
  const tokensB = b.toLowerCase().split(/\s+/).filter(Boolean);
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let overlap = 0;
  setA.forEach(t => {
    if (setB.has(t)) overlap += 1;
  });
  return overlap / Math.max(setA.size, setB.size, 1);
}

function tokenLengthCheck(entry) {
  if (!entry) return 0;
  if (typeof entry.tokens_used === 'number') return entry.tokens_used;
  const text = entry.response || entry.message || '';
  return text.split(/\s+/).filter(Boolean).length;
}

function assignCrashScores(results) {
  if (!Array.isArray(results)) return [];
  const weights = {
    repetition_loop: 1,
    semantic_conflict: 2,
    missing_output: 3,
    error_output: 4,
    token_explosion: 5,
    model_inconsistency: 6,
  };
  results.forEach(r => {
    if (r && r.reason) {
      r.crash_score = weights[r.reason] || 0;
    }
  });
  return results;
}

function assignCrashLevels(results) {
  if (!Array.isArray(results)) return [];
  results.forEach(r => {
    const score = r && typeof r.crash_score === 'number' ? r.crash_score : null;
    if (score === null || score <= 0) {
      r.crash_level = 'unknown';
    } else if (score >= 5) {
      r.crash_level = 'critical';
    } else if (score >= 3) {
      r.crash_level = 'warning';
    } else if (score >= 1) {
      r.crash_level = 'normal';
    } else {
      r.crash_level = 'unknown';
    }
  });
  return results;
}

function detectCrashes(logs, outPath = path.join(__dirname, 'crash_summary.json')) {
  if (!Array.isArray(logs)) return [];
  const results = [];
  const repeatCounts = Object.create(null);

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i] || {};
    const prev = logs[i - 1] || {};
    const agent = entry.agent_name || entry.agent;
    const model = entry.model;
    const msg = entry.response || entry.message || '';

    // repetition loop detection
    const prevMsg = prev.response || prev.message || '';
    const sameAgent = (prev.agent_name || prev.agent) === agent;
    const repKey = `${agent}|${msg}`;
    if (sameAgent && similarityCheck(msg, prevMsg) > 0.9) {
      repeatCounts[repKey] = (repeatCounts[repKey] || 1) + 1;
      const currTs = new Date(entry.timestamp || 0).getTime();
      const prevTs = new Date(prev.timestamp || 0).getTime();
      if (
        repeatCounts[repKey] >= 3 &&
        Number.isFinite(currTs) &&
        Number.isFinite(prevTs) &&
        Math.abs(currTs - prevTs) <= 60 * 1000
      ) {
        results.push({
          timestamp: entry.timestamp,
          agent,
          model,
          crash_flag: true,
          reason: 'repetition_loop',
          message: `Repeated same output ${repeatCounts[repKey]} times in 1 minute`,
        });
        repeatCounts[repKey] = 0;
      }
    } else {
      repeatCounts[repKey] = 1;
    }

    // semantic conflict detection
    const prevAgent = prev.agent_name || prev.agent;
    if (prevAgent && prevAgent !== agent && prevMsg && msg) {
      const yes = /\b(yes|sure|ok|okay|can|affirm|agree)\b/i;
      const no = /\b(no|not|cannot|can't|won't|disagree|unable)\b/i;
      if ((yes.test(prevMsg) && no.test(msg)) || (no.test(prevMsg) && yes.test(msg))) {
        results.push({
          timestamp: entry.timestamp,
          agent,
          model,
          crash_flag: true,
          reason: 'semantic_conflict',
          message: 'Conflicting response to previous agent',
        });
      }
    }

    // missing or error output
    if (!msg) {
      results.push({
        timestamp: entry.timestamp,
        agent,
        model,
        crash_flag: true,
        reason: 'missing_output',
        message: 'No message content',
      });
    }
    if (entry.error || /error|exception/i.test(msg)) {
      results.push({
        timestamp: entry.timestamp,
        agent,
        model,
        crash_flag: true,
        reason: 'error_output',
        message: 'Error encountered',
      });
    }

    // token explosion detection
    const len = tokenLengthCheck(entry);
    if (len > 2000) {
      results.push({
        timestamp: entry.timestamp,
        agent,
        model,
        crash_flag: true,
        reason: 'token_explosion',
        message: `Length ${len}`,
      });
    }

    // model mismatch detection
    if (sameAgent && prev.model && model && prev.model !== model) {
      const structured = str => /^\s*[\[{]/.test(str || '');
      if (structured(prevMsg) !== structured(msg)) {
        results.push({
          timestamp: entry.timestamp,
          agent,
          model,
          crash_flag: true,
          reason: 'model_inconsistency',
          message: 'Model structure mismatch',
        });
      }
    }
  }

  assignCrashScores(results);
  assignCrashLevels(results);

  const summary = results.reduce(
    (acc, r) => {
      const level = r && r.crash_level ? r.crash_level : 'unknown';
      if (acc[level] === undefined) acc[level] = 0;
      acc[level] += 1;
      return acc;
    },
    { normal: 0, warning: 0, critical: 0, unknown: 0 }
  );
  summary.score =
    summary.warning * 1 + summary.critical * 3 + summary.unknown * 0.5;

  if (outPath) {
    try {
      fs.writeFileSync(outPath, JSON.stringify({ summary, details: results }, null, 2));
    } catch (err) {
      console.error('Failed to write crash summary:', err);
    }
  }

  return results;
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
  (async () => {
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

    if (mode === 'summary') {
      let crashEntries = [];
      try {
        crashEntries = readLogFile(logPath);
      } catch (err) {
        console.error('Failed to read logs for crash summary:', err);
      }

      const crashResults = detectCrashes(crashEntries);
      const crashSummary = crashResults.reduce(
        (acc, r) => {
          const level = r && r.crash_level ? r.crash_level : 'unknown';
          if (acc[level] === undefined) acc[level] = 0;
          acc[level] += 1;
          return acc;
        },
        { normal: 0, warning: 0, critical: 0, unknown: 0 }
      );
      crashSummary.score =
        crashSummary.warning * 1 +
        crashSummary.critical * 3 +
        crashSummary.unknown * 0.5;

      console.log('Crash Summary:');
      console.log(`  - normal   : ${crashSummary.normal}`);
      console.log(`  - warning  : ${crashSummary.warning}`);
      console.log(`  - critical : ${crashSummary.critical}`);
      console.log(`  - unknown  : ${crashSummary.unknown}`);
      console.log(`Crash Score: ${crashSummary.score}`);

      if (crashSummary.critical > 0) {
        console.log(`\u26A0 CRITICAL DETECTED: ${crashSummary.critical} crash(es) found`);
        await notifySlack(`CRITICAL DETECTED: ${crashSummary.critical} crash(es) found`);
      }
    }
  })();
}

module.exports = { analyzeLogs, detectCrashes, assignCrashScores, assignCrashLevels };
