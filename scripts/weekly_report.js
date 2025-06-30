'use strict';

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'logs', 'multi-agent-log');
const DAYS = 7;

function findCrashSummaries(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findCrashSummaries(p));
    } else if (entry.isFile() && entry.name === 'crash_summary.json') {
      results.push(p);
    }
  }
  return results;
}

function getAgentName(filePath) {
  const rel = path.relative(BASE_DIR, filePath);
  const parts = rel.split(path.sep);
  return parts[0] || 'unknown';
}

function isRecent(filePath, days) {
  try {
    const stat = fs.statSync(filePath);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return stat.mtimeMs >= cutoff;
  } catch (_) {
    return false;
  }
}

function readSummary(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(txt);
  } catch (_) {
    return null;
  }
}

function formatTable(rows) {
  if (!rows.length) return '';
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map(r => String(r[i]).length))
  );
  const lines = rows.map((row, idx) => {
    const padded = row.map((val, i) => String(val).padEnd(widths[i]));
    const line = padded.join('  ');
    if (idx === 0) {
      const separator = widths.map(w => '-'.repeat(w)).join('  ');
      return line + '\n' + separator;
    }
    return line;
  });
  return lines.join('\n');
}

function generateWeeklyReport(baseDir = BASE_DIR, days = DAYS) {
  const files = findCrashSummaries(baseDir).filter(f => isRecent(f, days));
  const agents = {};
  for (const file of files) {
    const summary = readSummary(file);
    if (!summary) continue;
    const agent = getAgentName(file);
    if (!agents[agent]) {
      agents[agent] = { critical: 0, warning: 0, scoreSum: 0, scoreCount: 0 };
    }
    agents[agent].critical += Number(summary.critical) || 0;
    agents[agent].warning += Number(summary.warning) || 0;
    if (typeof summary.score === 'number' && !Number.isNaN(summary.score)) {
      agents[agent].scoreSum += summary.score;
      agents[agent].scoreCount += 1;
    }
  }

  const rows = [['Agent', 'Critical', 'Warnings', 'Score']];
  Object.keys(agents).sort().forEach(agent => {
    const data = agents[agent];
    const score = data.scoreCount ? (data.scoreSum / data.scoreCount).toFixed(1) : 'N/A';
    rows.push([agent, String(data.critical), String(data.warning), score]);
  });

  if (rows.length > 1) {
    const table = formatTable(rows);
    console.log(table);
  } else {
    console.log('No crash summaries in the past', days, 'days.');
  }
}

if (require.main === module) {
  generateWeeklyReport();
}

module.exports = { generateWeeklyReport };
