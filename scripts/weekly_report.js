'use strict';

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'logs', 'crash_summaries');
const DAYS = 7;

function readSummaries(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const txt = fs.readFileSync(path.join(dir, f), 'utf8');
        return JSON.parse(txt);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

function filterRecent(entries, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter(e => {
    const ts = Date.parse(e.date);
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function aggregate(entries) {
  const agents = {};
  entries.forEach(e => {
    const agent = e.agent || 'unknown';
    if (!agents[agent]) {
      agents[agent] = {
        total: 0,
        critical: 0,
        warning: 0,
        scoreSum: 0,
        count: 0,
        unperceived_score: null,
      };
    }
    agents[agent].total += Number(e.total) || 0;
    agents[agent].critical += Number(e.critical) || 0;
    agents[agent].warning += Number(e.warning) || 0;
    if (typeof e.score === 'number' && !Number.isNaN(e.score)) {
      agents[agent].scoreSum += e.score;
      agents[agent].count += 1;
    }
    if (e.unperceived_score && typeof e.unperceived_score.total === 'number') {
      agents[agent].unperceived_score = e.unperceived_score;
    }
  });
  return agents;
}

function formatTable(rows) {
  if (!rows.length) return '';
  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => String(r[i]).length)));
  const header =
    '| ' + rows[0].map((v, i) => String(v).padEnd(widths[i])).join(' | ') + ' |';
  const separator =
    '|' + widths.map(w => '-'.repeat(w + 2)).join('|') + '|';
  const lines = rows.slice(1).map(r =>
    '| ' + r.map((v, i) => String(v).padEnd(widths[i])).join(' | ') + ' |'
  );
  return [header, separator, ...lines].join('\n');
}

/**
 * Write table rows to a CSV file.
 * Values containing commas are wrapped in double quotes.
 * @param {string} filePath Path to the CSV file
 * @param {Array<Array<string>>} rows Table rows including header
 */
function writeCSVReport(filePath, rows) {
  const escape = value => {
    const str = String(value);
    if (str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    if (str.includes(',')) {
      return `"${str}"`;
    }
    return str;
  };
  const lines = rows.map(r => r.map(escape).join(','));
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

function generateWeeklyReport(dir = BASE_DIR, days = DAYS) {
  const summaries = filterRecent(readSummaries(dir), days);
  const data = aggregate(summaries);
  const agents = Object.keys(data);

  if (!agents.length) {
    console.log(`No crash summaries in the past ${days} days.`);
    return;
  }

  const rows = [['Agent', 'Total', 'Critical', 'Warning', 'Avg. Score', 'Unperceived Score']];
  agents.sort().forEach(agent => {
    const info = data[agent];
    const avg = info.count ? Math.round(info.scoreSum / info.count) : 'N/A';
    let critical = String(info.critical);
    if (info.critical > 5) critical += ' \uD83D\uDD25';
    const up = info.unperceived_score && info.unperceived_score.total;
    const upVal = typeof up === 'number' ? up : '';
    rows.push([
      agent,
      String(info.total),
      critical,
      String(info.warning),
      String(avg),
      String(upVal),
    ]);
  });

  console.log(formatTable(rows));

  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const outPath = path.join(reportDir, 'weekly_report.csv');
  writeCSVReport(outPath, rows);
}

if (require.main === module) {
  generateWeeklyReport();
}

module.exports = { generateWeeklyReport, writeCSVReport };
